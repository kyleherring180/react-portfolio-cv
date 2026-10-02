import { useEffect, useState } from 'react'
import AnimatedLetters from '../../../AnimatedLetters'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Loader from 'react-loaders'


const AiBugFixingPipelineBlog = () => {
  const [letterClass, setLetterClass] = useState('text-animate-blog')

  useEffect(() => {
    setTimeout(() => {
      return setLetterClass('text-animate-hover')
    }, 3000)
  }, [])

  return (
    <>
      <div className="container individual-blog-page">
        <div className="text-zone">
          <h1>
            <AnimatedLetters
              letterClass={letterClass}
              strArray={[
                'Building',
                ' ',
                'an',
                ' ',
                'Autonomous',
                ' ',
                'AI',
                ' ',
                'Bug-Fixing',
                ' ',
                'Pipeline',
                '.',
              ]}
              idx={25}
            />
          </h1>

          <p>
            Over the last few weeks I've been building something I've wanted to try for a while: a fully
            automated pipeline that takes a plain-English bug report and turns it into a real, reviewable pull
            request.
          </p>

          <p>
            It investigates the root cause, reproduces the bug, writes a fix, verifies the fix actually works, and
            opens the PR. No human touches a keyboard until the review step.
          </p>

          <p>
            This post covers the architecture, the protocols and frameworks involved, and the Kubernetes plumbing
            underneath it. Maybe more usefully, it also covers the design decisions that turned out to matter and
            the ones that bit me in production.
          </p>

          <p>
            I'll keep the specifics generic (this runs against real, private infrastructure), but everything about
            the design, the tools, and the tradeoffs below is exactly how it works.
          </p>

          <h2>The shape of the pipeline</h2>

          <p>
            The pipeline is a chain of small, single-responsibility agents. Each one is a tiny ASP.NET Core
            service with one job:
          </p>

          <ul>
            <li><strong>bug-clarify</strong> — turns the raw bug report into a clear, structured problem statement.</li>
            <li><strong>code-research</strong> — searches the target repository for context relevant to the bug.</li>
            <li><strong>root-cause</strong> — forms a hypothesis about what's actually wrong, and grounds it in a real command run against a real checkout rather than trusting its own guess.</li>
            <li><strong>reproduce</strong> — the workhorse. It clones the repo, runs setup, and executes shell commands inside a real, disposable environment, so every other agent reasons about real output, not imagined output.</li>
            <li><strong>fix</strong> — writes the actual code change.</li>
            <li><strong>verify</strong> — applies the fix to a fresh checkout and judges, with real evidence, whether it actually resolves the reported bug.</li>
            <li><strong>github-update</strong> — opens a real, draft pull request with the change.</li>
            <li><strong>review</strong> — a final automated pass over the diff before a human ever sees it.</li>
          </ul>

          <p>
            An <strong>orchestrator</strong> sits above all of this. It sequences the stages, tracks state per
            run, and calls out to a <strong>pipeline-status</strong> service. A small React frontend polls that
            service so a human can watch the run progress in real time.
          </p>

          <p>
            The single biggest architectural decision was making every one of these agents boring and narrow. No
            agent tries to be clever about more than one thing:
          </p>

          <ul>
            <li><code className="code-highlight">root-cause</code> doesn't write code.</li>
            <li><code className="code-highlight">fix</code> doesn't decide whether its own fix is correct.</li>
            <li><code className="code-highlight">verify</code> doesn't open pull requests.</li>
          </ul>

          <p>
            That separation made every agent easy to reason about, easy to test in isolation, and, critically,
            easy to replace or rework without destabilizing the rest of the chain. Several of the redesigns I
            describe further down only touched one agent's internals. Nothing else in the pipeline had to change.
          </p>

          <h2>Agent-to-agent communication: where A2A fits, and where it doesn't</h2>

          <p>
            <a href="https://a2a-protocol.org/" target="_blank" rel="noreferrer">Agent2Agent (A2A)</a> is an
            emerging open protocol for agent interoperability. The idea is that an agent exposes a discoverable{' '}
            <strong>AgentCard</strong> (a small JSON document describing what it does and how to talk to it) at a
            well-known URL. A caller can then resolve capabilities the way a browser resolves a favicon, instead of
            every team inventing its own agent-calling convention.
          </p>

          <p>
            I used the <code className="code-highlight">A2A.AspNetCore</code> and Microsoft's{' '}
            <code className="code-highlight">Microsoft.Agents.AI.Hosting.A2A.AspNetCore</code> packages to expose
            each agent over A2A, alongside a well-known agent card describing its purpose.
          </p>

          <p>
            In practice, I ended up with a mixed model. I think that was the right call rather than a compromise:
          </p>

          <ul>
            <li>
              <strong>Real A2A for genuine agent conversations.</strong> When the caller wants to{' '}
              <em>discover</em> and talk to another agent as a first-class participant (for example,{' '}
              <code className="code-highlight">root-cause</code> asking{' '}
              <code className="code-highlight">code-research</code> a free-form investigative question), the call
              goes over real A2A: card resolution, then a structured message exchange.
            </li>
            <li>
              <strong>Plain typed JSON over HTTP for internal RPC.</strong> When two services will only ever call
              each other (the orchestrator driving each pipeline stage, for instance), A2A adds nothing. Its
              discovery machinery is valuable when caller and callee are loosely coupled and might evolve
              independently. It's just ceremony when they're two halves of the same pipeline that already know
              each other's exact request/response shape.
            </li>
          </ul>

          <div className="callout">
            <p>
              <strong>Gotcha: trailing slashes.</strong> A2A's card resolution follows standard URI
              relative-reference resolution against your service's base URL. If that base URL doesn't end in a
              trailing slash, resolving <code className="code-highlight">.well-known/agent-card.json</code> against
              it silently drops the last path segment of your base URL, and you get a 404.
            </p>
            <p>
              The spec is being followed exactly; the caller's assumption is wrong. Normalizing every base URL to
              always end in <code className="code-highlight">/</code> before resolving fixed it for good.
            </p>
          </div>

          <h2>Frameworks: Microsoft's Agent Framework hosting Claude</h2>

          <p>
            Every agent is a .NET / ASP.NET Core minimal API. Microsoft's (still-preview) Agent Framework,{' '}
            <code className="code-highlight">Microsoft.Agents.AI</code>, is the hosting abstraction.{' '}
            <a href="https://www.anthropic.com/claude" target="_blank" rel="noreferrer">Anthropic's Claude</a>{' '}
            (Sonnet, mostly) is the actual model behind each agent, via the Anthropic .NET SDK's{' '}
            <code className="code-highlight">AsAIAgent()</code> adapter.
          </p>

          <p>
            Each agent gets its own instructions file and its own narrow toolset rather than one giant
            do-everything system prompt. It's the same single-responsibility principle from the pipeline shape,
            applied at the prompt level.
          </p>

          <h3>Never trust the model when a real command can check it</h3>

          <p>
            This pattern shows up in almost every agent. Early on, <code className="code-highlight">root-cause</code>{' '}
            would have the model assert a file path as part of its hypothesis, before any real command had
            confirmed that path existed. That produced confidently wrong guesses (a plausible-looking path,
            several directories off from the real one) that then broke the downstream fix step.
          </p>

          <p>
            The fix wasn't "ask the model to be more careful". It was to stop asking. After a hypothesis is
            confirmed, the pipeline deterministically searches the real, cloned checkout for a file with that
            name. It only escalates back to the model if the file genuinely can't be found anywhere in the repo.
          </p>

          <p>
            Trust real command output over model assertions, every time you can afford to.
          </p>

          <h2>Ephemeral execution: every real command runs in a disposable Kubernetes Job</h2>

          <p>
            The agents that need to touch real code (<code className="code-highlight">reproduce</code>,{' '}
            <code className="code-highlight">fix</code>, and <code className="code-highlight">verify</code>) don't
            keep any persistent checkout. Each request:
          </p>

          <ul>
            <li>spins up a brand-new Kubernetes Job,</li>
            <li>clones the target repo fresh inside it,</li>
            <li>runs whatever real commands that stage needs (setup, build, test, arbitrary shell),</li>
            <li>then tears the whole thing down.</li>
          </ul>

          <p>
            A small shared client wraps the Kubernetes API. It creates the Job, waits for the pod to be ready, and
            execs into it over the Kubernetes exec/WebSocket protocol to run commands and capture real
            stdout/stderr/exit codes. Then it deletes the Job: win or lose, every single time.
          </p>

          <p>
            That gets you a few things for free:
          </p>

          <ul>
            <li>No state ever leaks between runs.</li>
            <li>No accumulating disk usage.</li>
            <li>No long-lived credentials sitting in a pod.</li>
            <li>
              A blast radius limited to one disposable Job rather than a shared, long-running service. That matters
              a lot for an agent that's allowed to run arbitrary commands proposed by an LLM.
            </li>
          </ul>

          <div className="callout">
            <p>
              <strong>Gotcha: <code className="code-highlight">pods/exec</code> needs two RBAC verbs.</strong> The
              WebSocket upgrade handshake for exec is always an HTTP <code className="code-highlight">GET</code>{' '}
              (per RFC 6455). So an RBAC role that only grants <code className="code-highlight">create</code> on{' '}
              <code className="code-highlight">pods/exec</code> (the obvious verb to grant) will fail every exec
              call with a bare, unhelpful 403.
            </p>
            <p>
              You need <em>both</em> <code className="code-highlight">create</code> and{' '}
              <code className="code-highlight">get</code>. It's a well-known trap once you've hit it, and completely
              invisible before that.
            </p>
          </div>

          <SyntaxHighlighter language="yaml" style={coldarkDark}>
            {`apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: bug-fixing-executor
rules:
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["create", "get", "list", "watch", "delete"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create", "get"]   # both are required - exec's upgrade handshake is a real GET
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]`}
          </SyntaxHighlighter>

          <h2>Kubernetes setup: locking everything down by default</h2>

          <p>
            The cluster this runs in uses <a href="https://cilium.io/" target="_blank" rel="noreferrer">Cilium</a>{' '}
            with a default-deny egress policy for the namespace. Nothing gets out to the internet unless an
            explicit allow rule names it.
          </p>

          <p>
            That's a genuinely good security posture. It also meant every external dependency this pipeline needed
            had to be discovered and allow-listed one at a time, in production, the hard way:
          </p>

          <ul>
            <li>GitHub,</li>
            <li>the package registries the target repos build against,</li>
            <li>the LLM provider's API,</li>
            <li>and, easy to forget, the Kubernetes API server itself, since the ephemeral Jobs need to talk back to it.</li>
          </ul>

          <SyntaxHighlighter language="yaml" style={coldarkDark}>
            {`apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: egress-to-github
spec:
  endpointSelector: {}
  egress:
    - toFQDNs:
        - matchName: "github.com"
        - matchName: "api.github.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
---
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: egress-to-kube-apiserver
spec:
  endpointSelector: {}
  egress:
    - toEntities:
        - kube-apiserver`}
          </SyntaxHighlighter>

          <p>
            The pods themselves run under a hardened security context by default across the whole cluster:
            non-root, <code className="code-highlight">readOnlyRootFilesystem: true</code>, all capabilities
            dropped, no privilege escalation. That's the right default.
          </p>

          <div className="callout">
            <p>
              <strong>Gotcha: a read-only root filesystem has no writable <code className="code-highlight">/tmp</code>.</strong>{' '}
              Any agent that legitimately needs to write to disk itself (rather than delegating that work to an
              ephemeral Job, like most of this pipeline does) needs an explicit{' '}
              <code className="code-highlight">emptyDir</code> volume mounted at{' '}
              <code className="code-highlight">/tmp</code>. Forget it, and{' '}
              <code className="code-highlight">Directory.CreateDirectory()</code> fails with a plain{' '}
              <code className="code-highlight">IOException</code>.
            </p>
          </div>

          <SyntaxHighlighter language="yaml" style={coldarkDark}>
            {`securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
  - name: tmp
    emptyDir: {}`}
          </SyntaxHighlighter>

          <p>
            Deploys go through GitOps: Flux reconciles a set of Kustomize overlays per environment.
          </p>

          <p>
            Authentication into the target GitHub repos uses a GitHub App installation token, fetched fresh per
            request, rather than a long-lived personal access token sitting in a secret. Short-lived, scoped, and
            automatically rotated is a much better property to have on something that's allowed to open pull
            requests autonomously.
          </p>

          <h2>Design decision: bounded loops with a deterministic router, not "ask the model again"</h2>

          <p>
            Both <code className="code-highlight">root-cause</code>'s hypothesis search and (more recently){' '}
            <code className="code-highlight">verify</code>'s test-authoring step follow the same shape:
          </p>

          <ul>
            <li>The model proposes something.</li>
            <li>A real command executes it.</li>
            <li>
              A small, plain, fully unit-tested piece of code (not another model call) decides whether to proceed,
              loop back for another attempt, or escalate because the round cap was reached.
            </li>
          </ul>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`public static class VerifyAndLoopCoordinator
{
    public static RoutingDecision Route(VerificationVerdict verdict, int roundCap)
    {
        if (verdict.Confirmed)
            return RoutingDecision.Proceed;

        return verdict.Round >= roundCap
            ? RoutingDecision.Escalate
            : RoutingDecision.Loop;
    }
}`}
          </SyntaxHighlighter>

          <p>
            I like this pattern a lot. Routing logic is exactly the kind of thing you don't want an LLM deciding
            non-deterministically on every call. As plain code it's cheap, deterministic, trivially
            unit-testable, and reused unchanged across two completely different agents.
          </p>

          <p>
            The model's job is to propose and to judge. The model's job is never to decide when to stop.
          </p>

          <h2>Design decision: give the verifier real evidence, not just a pass/fail</h2>

          <p>
            This is the redesign I'm happiest with, because it came directly out of a real production failure.
          </p>

          <h3>The problem</h3>

          <p>
            <code className="code-highlight">verify</code>'s original job was simple: apply the fix, run the
            target repo's test command, hand the raw output to an LLM, and ask "does this actually verify the
            fix?"
          </p>

          <p>
            That works fine when the bug already has test coverage. It falls over completely for the enormous
            number of real bugs that don't, like a wrong color on a button or a mislabeled field. The existing
            test suite has nothing to say about those changes, and an honest model correctly refuses to confirm
            something it has no evidence for.
          </p>

          <h3>My first fix was wrong</h3>

          <p>
            It's worth admitting why. I added a permanent test asserting the "correct" behavior to a synthetic
            scenario I'd built specifically to exercise this pipeline end-to-end.
          </p>

          <p>
            That worked for the synthetic scenario and broke every unrelated real bug fix afterward.{' '}
            <code className="code-highlight">verify</code> runs the whole test suite, not just tests related to
            the reported bug, so one permanently failing, unrelated test was now poisoning every verdict. A
            classic fix that solves the exact case in front of you while quietly breaking the general case.
          </p>

          <h3>The real fix: better evidence</h3>

          <p>
            Instead of gaming the input the verifier was already getting, I gave it better evidence:
          </p>

          <ul>
            <li>
              <strong>Before/after content.</strong> Capture each changed file's real content <em>before</em> the
              fix, not just after, so the model can judge an actual diff rather than only the final state. For
              plainly visual or literal changes, that's conclusive on its own. No test required.
            </li>
            <li>
              <strong>A bounded test-authoring loop.</strong> For changes the model can't confirm just by reading
              (real logic, not styling), it can request a loop capped at three rounds. It grounds itself in one
              real, existing test file from the repo so it isn't guessing at test conventions blind, authors a
              small test targeting the specific root cause, runs it for real, and judges the real result.
            </li>
            <li>
              <strong>Genuinely disposable tests.</strong> The authored test is written into the same ephemeral
              checkout, run exactly once, and deleted immediately afterward. It's never returned in any response
              and never reaches the real pull request. Given what the first, wrong fix cost me, I wanted "this can
              never leak into shared state" to be structural, not just a documented intention.
            </li>
          </ul>

          <p>
            Verified end-to-end against the real cluster: the pipeline now confirms a plain visual fix directly
            from the diff in about a minute. When it has to write and run its own targeted test for something
            with real logic behind it, it takes closer to two. A small, honest latency cost for a much stronger
            verdict.
          </p>

          <h2>Tradeoffs and current limitations</h2>

          <ul>
            <li>
              <strong>LLM judgment isn't fully deterministic.</strong> The exact same input can occasionally get a
              different verdict from <code className="code-highlight">verify</code> across two separate runs. The
              routing logic around it is deterministic; the judgment feeding into it isn't. I don't think that's
              fully solvable without giving up on natural-language judgment entirely.
            </li>
            <li>
              <strong>The authored-test loop re-runs the whole test suite, every round.</strong> That's simple and
              consistent with how the rest of the pipeline treats the test command, but it's not cheap. Scoping
              to just the new test would be faster and is a reasonable next step.
            </li>
            <li>
              <strong>Round caps trade thoroughness for cost and latency</strong>, on purpose. A cap of three
              rounds means a genuinely hard-to-test bug fails fast with a clear "couldn't confirm", rather than
              burning an unbounded number of model calls chasing certainty.
            </li>
            <li>
              <strong>Fixes are currently scoped to a single file.</strong> Bugs that need coordinated changes
              across multiple files aren't supported yet.
            </li>
            <li>
              <strong>Authored tests are throwaway by design.</strong> That's the right call for verification
              safety, but it means a fix that would benefit from a permanent regression test doesn't get one
              automatically. If that's wanted, it should be a deliberate decision the{' '}
              <code className="code-highlight">fix</code> stage makes, not a side effect of how verification
              happens to work.
            </li>
            <li>
              <strong>No autonomous merging</strong>, and I don't want there to be. Every pull request this
              pipeline opens is a draft, and a human makes the final call. That's a deliberate limitation, not a
              gap to close.
            </li>
            <li>
              <strong>Network allow-listing is manual and reactive.</strong> Default-deny egress is the right call,
              but every new external dependency shows up as a real production failure the first time an agent
              needs to reach it, rather than something caught in advance.
            </li>
            <li>
              <strong>Minimal base images need real curation.</strong> A slimmed-down image that's missing{' '}
              <code className="code-highlight">git</code> or a CA certificate bundle fails in ways that are easy
              to diagnose once you've seen them, and completely opaque the first time.
            </li>
          </ul>

          <h2>What I'd consider next</h2>

          <ul>
            <li>
              <strong>Scoped test re-runs</strong> instead of the whole suite every round.
            </li>
            <li>
              <strong>Multi-file fix support</strong> for bugs that genuinely need it.
            </li>
            <li>
              <strong>Deliberate regression tests:</strong> letting <code className="code-highlight">fix</code>{' '}
              propose a permanent regression test as its own explicit output, separate from anything{' '}
              <code className="code-highlight">verify</code> authors for itself.
            </li>
            <li>
              <strong>Better observability:</strong> full distributed tracing across every agent hop in a single
              run, so debugging a slow or failed run is a five-second trace lookup instead of a "check three
              different pods' logs" exercise.
            </li>
            <li>
              <strong>Keeping an eye on A2A.</strong> It's early, but the discovery model is the right idea, and I
              expect the tooling around it to mature quickly.
            </li>
          </ul>

          <h2>A closing thought</h2>

          <p>
            Building this was itself an exercise in the same thing it does. I used an AI coding assistant
            throughout: to interrogate design decisions before committing to them, to implement against a written
            plan, and, more than once, to independently re-diagnose a production failure by reproducing it
            directly against the real cluster rather than trusting an assumption.
          </p>

          <p>
            Every bug described above was found the same way: by actually running the real system further than
            the last fix allowed, not by guessing what might be wrong. That discipline turned out to matter a lot
            more than any individual line of code.
          </p>

          <p>
            If you're building something similar, or have thoughts on any of the tradeoffs above, I'd love to hear
            from you. Feel free to reach out via my Contact page.
          </p>
          <p className="post-signoff">
            Kyle
          </p>

        </div>
      </div>
      <Loader type="pacman" active/>
    </>
  )
}

export default AiBugFixingPipelineBlog;
