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
            request - investigating the root cause, reproducing it, writing a fix, verifying the fix actually
            works, and opening the PR, all without a human touching a keyboard until the review step.
          </p>

          <p>
            This post is about the architecture, the protocols and frameworks involved, the Kubernetes plumbing
            underneath it, and - maybe more usefully than any of that - the design decisions that turned out to
            matter and the ones that bit me in production. I'll keep the specifics generic (this runs against
            real, private infrastructure), but everything about the design, the tools, and the tradeoffs below is
            exactly how it works.
          </p>

          <h2>The shape of the pipeline</h2>

          <p>
            The pipeline is a chain of small, single-responsibility agents, each one a tiny ASP.NET Core service
            with one job:
          </p>

          <ul>
            <li><strong>bug-clarify</strong> - takes the raw bug report and turns it into a clear, structured problem statement.</li>
            <li><strong>code-research</strong> - searches the target repository for context relevant to the bug.</li>
            <li><strong>root-cause</strong> - forms a hypothesis about what's actually wrong, and grounds it in a real command run against a real checkout rather than trusting its own guess.</li>
            <li><strong>reproduce</strong> - the workhorse: clones the repo, runs setup, and executes arbitrary shell commands inside a real, disposable environment so every other agent is reasoning about real output, not imagined output.</li>
            <li><strong>fix</strong> - writes the actual code change.</li>
            <li><strong>verify</strong> - applies the fix to a fresh checkout and judges, with real evidence, whether it actually resolves the reported bug.</li>
            <li><strong>github-update</strong> - opens a real, draft pull request with the change.</li>
            <li><strong>review</strong> - a final automated pass over the diff before a human ever sees it.</li>
          </ul>

          <p>
            An <strong>orchestrator</strong> sits above all of this, sequencing the stages, tracking state per
            run, and calling out to a <strong>pipeline-status</strong> service that a small React frontend polls
            so a human can watch the run progress in real time.
          </p>

          <p>
            The single biggest architectural decision was making every one of these agents boring and narrow. No
            agent tries to be clever about more than one thing. <code className="code-highlight">root-cause</code> doesn't
            write code. <code className="code-highlight">fix</code> doesn't decide whether its own fix is correct.{' '}
            <code className="code-highlight">verify</code> doesn't open pull requests. That separation made every
            individual agent easy to reason about, easy to test in isolation, and - critically - easy to replace
            or rework without destabilizing the rest of the chain. Several of the redesigns I describe further
            down only touched one agent's internals; nothing else in the pipeline had to change.
          </p>

          <h2>Agent-to-agent communication: where A2A fits, and where it doesn't</h2>

          <p>
            <a href="https://a2a-protocol.org/" target="_blank" rel="noreferrer">Agent2Agent (A2A)</a> is an
            emerging open protocol for agent interoperability - the idea being that an "agent" should expose a
            discoverable <strong>AgentCard</strong> (a small JSON document describing what it does and how to
            talk to it) at a well-known URL, so that a caller can resolve capabilities the way a browser resolves
            a favicon, instead of every team inventing its own bespoke agent-calling convention. I used the{' '}
            <code className="code-highlight">A2A.AspNetCore</code> and Microsoft's{' '}
            <code className="code-highlight">Microsoft.Agents.AI.Hosting.A2A.AspNetCore</code> packages to expose
            each agent over A2A, alongside a well-known agent card describing its purpose.
          </p>

          <p>
            In practice, I ended up with a mixed model, and I think that was the right call rather than a
            compromise:
          </p>

          <ul>
            <li>
              Calls where the caller genuinely wants to <em>discover</em> and talk to another agent as a
              first-class conversational participant (for example, <code className="code-highlight">root-cause</code> asking{' '}
              <code className="code-highlight">code-research</code> a free-form investigative question) go over
              real A2A - card resolution, then a structured message exchange.
            </li>
            <li>
              Calls that are really just internal RPC between two services that will only ever call each other -
              the orchestrator driving each pipeline stage, for instance - go over plain, typed JSON over HTTP.
              A2A's discovery machinery adds real value when the caller and callee are loosely coupled and might
              evolve independently. It adds only ceremony when they're two halves of the same pipeline that
              already know each other's exact request/response shape.
            </li>
          </ul>

          <p>
            One sharp edge worth calling out if you go this route: A2A's card resolution follows standard URI
            relative-reference resolution against your service's base URL. If that base URL doesn't end in a
            trailing slash, resolving <code className="code-highlight">.well-known/agent-card.json</code> against
            it will silently drop the last path segment of your base URL and 404 - a classic case of a spec being
            followed exactly and a caller's assumption being wrong. Normalizing every base URL to always end in{' '}
            <code className="code-highlight">/</code> before resolving fixed it for good.
          </p>

          <h2>Frameworks: Microsoft's Agent Framework hosting Claude</h2>

          <p>
            Every agent is a .NET / ASP.NET Core minimal API, using Microsoft's (still-preview) Agent Framework -{' '}
            <code className="code-highlight">Microsoft.Agents.AI</code> - as the hosting abstraction, with{' '}
            <a href="https://www.anthropic.com/claude" target="_blank" rel="noreferrer">Anthropic's Claude</a>{' '}
            (Sonnet, mostly) as the actual model behind each agent, via the Anthropic .NET SDK's{' '}
            <code className="code-highlight">AsAIAgent()</code> adapter. Each agent gets its own instructions
            file and its own narrow toolset rather than one giant do-everything system prompt - the same
            single-responsibility principle from the pipeline shape, applied at the prompt level.
          </p>

          <p>
            One pattern shows up in almost every agent: never trust the model's own claim when a cheap, real
            command can ground it instead. Early on, <code className="code-highlight">root-cause</code> would
            have the model assert a file path as part of its hypothesis, before any real command had confirmed
            that path actually existed. That produced confidently wrong guesses (a plausible-looking path instead
            of the real one, several directories off) that then broke the downstream fix step. The fix wasn't "ask
            the model to be more careful" - it was to stop asking. After a hypothesis is confirmed, the pipeline
            deterministically searches the real, cloned checkout for a file with that name, and only escalates
            back to the model if the file genuinely can't be found anywhere in the repo. Trust real command output
            over model assertions, every time you can afford to.
          </p>

          <h2>Ephemeral execution: every real command runs in a disposable Kubernetes Job</h2>

          <p>
            None of the agents that need to touch real code - <code className="code-highlight">reproduce</code>,{' '}
            <code className="code-highlight">fix</code>, and <code className="code-highlight">verify</code> - keep
            any persistent checkout. Each request spins up a brand-new Kubernetes Job, clones the target repo fresh
            inside it, runs whatever real commands that stage needs (setup, build, test, arbitrary shell), then
            tears the whole thing down. A small shared client wraps the Kubernetes API to create the Job, wait for
            the pod to be ready, exec into it over the Kubernetes exec/WebSocket protocol to run commands and
            capture real stdout/stderr/exit codes, then delete it - win or lose, every single time.
          </p>

          <p>
            That gets you a few things for free: no state ever leaks between runs, no accumulating disk usage, no
            long-lived credentials sitting in a pod, and - importantly for an agent that's allowed to run
            arbitrary commands proposed by an LLM - a blast radius limited to one disposable Job rather than a
            shared, long-running service.
          </p>

          <p>
            The Kubernetes exec protocol turned out to have a couple of real gotchas worth knowing about if you
            build this yourself. The WebSocket upgrade handshake for exec is always an HTTP <code className="code-highlight">GET</code>{' '}
            (per RFC 6455), which means an RBAC role that only grants <code className="code-highlight">create</code> on{' '}
            <code className="code-highlight">pods/exec</code> - the obvious, intuitive verb to grant - will fail
            every exec call with a bare, unhelpful 403. You need <em>both</em>{' '}
            <code className="code-highlight">create</code> and <code className="code-highlight">get</code>. It's a
            well-known trap once you've hit it once, and completely invisible before that.
          </p>

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
            with a default-deny egress policy for the namespace - nothing gets out to the internet unless there's
            an explicit allow rule naming it. That's a genuinely good security posture, and it also meant that
            every single external dependency this pipeline needed had to be discovered and allow-listed one at a
            time, in production, the hard way: GitHub, the package registries the target repos build against, the
            LLM provider's API, and - easy to forget - the Kubernetes API server itself, since the ephemeral Jobs
            need to talk back to it.
          </p>

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
            The pods themselves run under a hardened security context by default across the whole cluster: non-root,{' '}
            <code className="code-highlight">readOnlyRootFilesystem: true</code>, all capabilities dropped, no
            privilege escalation. That's the right default, but it has one real consequence worth knowing before
            you hit it in production: any agent that legitimately needs to write to disk itself (rather than
            delegating that work to an ephemeral Job, like most of this pipeline does) needs an explicit{' '}
            <code className="code-highlight">emptyDir</code> volume mounted at <code className="code-highlight">/tmp</code>{' '}
            - a read-only root filesystem has no writable temp directory by default, and{' '}
            <code className="code-highlight">Directory.CreateDirectory()</code> will fail with a plain{' '}
            <code className="code-highlight">IOException</code> if you forget it.
          </p>

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
            Deploys go through GitOps - Flux reconciling a set of Kustomize overlays per environment - and
            authentication into the target GitHub repos happens via a GitHub App installation token, fetched
            fresh per request, rather than a long-lived personal access token sitting in a secret. Short-lived,
            scoped, and automatically rotated is a much better property to have on something that's allowed to
            open pull requests autonomously.
          </p>

          <h2>Design decision: bounded loops with a deterministic router, not "ask the model again"</h2>

          <p>
            Both <code className="code-highlight">root-cause</code>'s hypothesis search and (more recently){' '}
            <code className="code-highlight">verify</code>'s test-authoring step follow the same shape: the model
            proposes something, a real command executes it, and then a small, plain, fully unit-tested piece of
            code - not another model call - decides whether to proceed, loop back for another attempt, or
            escalate because the round cap was reached.
          </p>

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
            non-deterministically on every call - it's cheap, deterministic, trivially unit-testable, and reused
            unchanged across two completely different agents. The model's job is to propose and to judge; the
            model's job is never to decide when to stop.
          </p>

          <h2>Design decision: give the verifier real evidence, not just a pass/fail</h2>

          <p>
            This is the redesign I'm happiest with, because it came directly out of a real production failure.{' '}
            <code className="code-highlight">verify</code>'s original job was simple: apply the fix, run the
            target repo's test command, hand the raw output to an LLM, and ask "does this actually verify the
            fix?" That works fine when the bug already has test coverage. It falls over completely for the
            enormous number of real bugs that don't - a wrong color on a button, a mislabeled field - where the
            existing test suite has nothing to say about the change at all, and an honest model correctly refuses
            to confirm something it has no evidence for.
          </p>

          <p>
            My first fix for this was wrong, and it's worth admitting why: I added a permanent test asserting the
            "correct" behavior to a synthetic scenario I'd built specifically to exercise this pipeline
            end-to-end. That worked for the synthetic scenario and broke every unrelated real bug fix afterward,
            because <code className="code-highlight">verify</code> runs the whole test suite, not just tests
            related to the reported bug - and now one permanently-failing, unrelated test was poisoning every
            verdict. Classic case of a fix that solves the exact case in front of you while quietly breaking the
            general case.
          </p>

          <p>
            The real fix was to give the verifier better evidence instead of gaming the input it was already
            getting:
          </p>

          <ul>
            <li>
              Capture each changed file's real content <em>before</em> the fix, not just after, so the model can
              judge an actual before/after diff rather than only the final state. For plainly visual or literal
              changes, that's conclusive on its own - no test required.
            </li>
            <li>
              For changes the model genuinely can't confirm just by reading - real logic, not styling - let it
              request a bounded (capped at three rounds) loop: ground itself in one real, existing test file from
              the repo so it isn't guessing at test conventions blind, author a small, disposable test targeting
              the specific root cause, run it for real, and judge the real result.
            </li>
            <li>
              That authored test is genuinely disposable - written into the same ephemeral checkout, run exactly
              once, and deleted immediately afterward. It's never returned in any response and never reaches the
              real pull request. Given what the first, wrong fix cost me, I wanted the "this can never leak into
              shared state" property to be structural, not just a documented intention.
            </li>
          </ul>

          <p>
            Verified end-to-end against the real cluster: the same pipeline run now confirms a plain visual fix
            directly from the diff in about a minute, and correctly takes closer to two when it has to write and
            run its own targeted test for something with real logic behind it - a small, honest latency cost for
            a much stronger verdict.
          </p>

          <h2>Tradeoffs and current limitations</h2>

          <ul>
            <li>
              <strong>LLM judgment isn't fully deterministic.</strong> The exact same input can occasionally get a
              different verdict from <code className="code-highlight">verify</code> across two separate runs. The
              routing logic around it is deterministic; the judgment feeding into that routing isn't, and I don't
              think that's fully solvable without giving up on natural-language judgment entirely.
            </li>
            <li>
              <strong>The authored-test loop re-runs the whole test suite, every round.</strong> That's simple and
              consistent with how the rest of the pipeline already treats the test command, but it's not cheap -
              scoping to just the new test would be faster and is a reasonable next step.
            </li>
            <li>
              <strong>Round caps trade thoroughness for cost and latency</strong> on purpose. A cap of three
              rounds for authoring a test means a genuinely hard-to-test bug fails fast with a clear "couldn't
              confirm" rather than burning an unbounded amount of model calls chasing certainty.
            </li>
            <li>
              <strong>Fixes are currently scoped to a single file.</strong> Real bugs that need coordinated changes
              across multiple files aren't supported yet.
            </li>
            <li>
              <strong>Authored tests are throwaway by design</strong>, which is the right call for verification
              safety, but it also means a fix that would have benefited from a permanent regression test doesn't
              get one automatically. If that's wanted, it should be a deliberate decision the <code className="code-highlight">fix</code>{' '}
              stage makes on purpose, not a side effect of how verification happens to work.
            </li>
            <li>
              <strong>No autonomous merging</strong> - and I don't want there to be. Every pull request this
              pipeline opens is a draft, and a human makes the final call. That's a deliberate limitation, not a
              gap to close.
            </li>
            <li>
              <strong>Network allow-listing is manual and reactive.</strong> A default-deny egress policy is the
              right call, but it means every new external dependency shows up as a real production failure the
              first time an agent needs to reach it, rather than something caught in advance.
            </li>
            <li>
              <strong>Minimal base images need real curation.</strong> A slimmed-down container image that's
              missing <code className="code-highlight">git</code> or a CA certificate bundle fails in ways that
              are easy to diagnose once you've seen them and completely opaque the first time.
            </li>
          </ul>

          <h2>What I'd consider next</h2>

          <p>
            A few directions feel like the natural next steps: smarter, scoped test re-runs instead of the whole
            suite every round; multi-file fix support for bugs that genuinely need it; letting{' '}
            <code className="code-highlight">fix</code> deliberately propose a permanent regression test as its
            own explicit output, separate from anything <code className="code-highlight">verify</code> authors for
            itself; and better observability - full distributed tracing across every agent hop in a single run, so
            a slow or failed pipeline run is a five-second trace lookup instead of a "check three different pods'
            logs" exercise. I'd also keep watching the A2A ecosystem - it's early, but the discovery model is the
            right idea, and I expect the tooling around it to mature quickly.
          </p>

          <p>
            One last thing worth saying: building this was itself an exercise in the same thing it does. I used
            an AI coding assistant throughout - to interrogate design decisions before committing to them, to
            implement against a written plan, and, more than once, to independently re-diagnose a production
            failure by reproducing it directly against the real cluster rather than trusting an assumption. Every
            single bug described above was found the same way: by actually running the real system further than
            the last fix allowed, not by guessing what might be wrong. That discipline turned out to matter a lot
            more than any individual line of code.
          </p>

          <p>
            If you're building something similar, or have thoughts on any of the tradeoffs above, I'd love to hear
            from you - feel free to reach out via my Contact page.
          </p>
          <p>
            Kyle
          </p>

        </div>
      </div>
      <Loader type="pacman" active/>
    </>
  )
}

export default AiBugFixingPipelineBlog;
