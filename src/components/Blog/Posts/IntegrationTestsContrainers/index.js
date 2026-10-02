import { useEffect, useState } from 'react'
import AnimatedLetters from '../../../AnimatedLetters'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Loader from 'react-loaders'


const IntegrationTestsContainersBlog = () => {
  const [letterClass, setLetterClass] = useState('text-animate-blog')

  useEffect(() => {
    setTimeout(() => {
      return setLetterClass('text-animate-hover')
    }, 3000)
  }, [])

  return(
    <>
      <div className="container individual-blog-page">
        <div className="text-zone">
          <h1>
            <AnimatedLetters
              letterClass={letterClass}
              strArray={[
                'Integration',
                ' ',
                'Tests',
                ' ',
                'using',
                ' ',
                'Testcontainers',
                ' ',
                'for',
                ' ',
                '.NET',
                ' ',
                'and',
                ' ',
                'Microsoft',
                ' ',
                'SQL',
                ' ',
                'Server',
                '.',
              ]
              }
              idx={25}
            />
          </h1>
          <p>
            When it comes to testing in software development, opinions often vary on the value and types of tests that
            should be prioritized. Most developers agree that unit tests are foundational for any codebase. Integration
            tests are equally important, and often underappreciated.
          </p>

          <h2>Why integration tests matter</h2>

          <p>
            Unit tests verify individual components in isolation. Integration tests validate that different parts of
            your system work together as expected. They catch issues that unit tests might miss, giving you confidence
            that your changes haven't introduced regressions or deviations in functionality.
          </p>

          <p>
            When my integration tests pass after code changes, I can deploy to production with peace of mind, knowing
            my application should continue to perform as intended.
          </p>

          <p>
            Integration tests can be more challenging to implement. They often involve managing multiple dependencies,
            which makes setup and maintenance more complex. Despite this, I firmly believe that well-designed
            integration tests provide significantly more value than unit tests.
          </p>

          <p>
            By validating how components interact, integration tests often cover the functionality of individual units
            as well. With a robust suite of integration tests, you may reduce your reliance on unit tests, streamlining
            your testing strategy while keeping confidence in your system's behavior.
          </p>

          <h2>The database problem</h2>

          <p>
            Some dependencies may need to be mocked in integration tests, but it's essential to keep this to a minimum.
            The more we mock, the further our tests drift from the real system, and the less effective they become.
          </p>

          <p>
            One of the most challenging dependencies to include is the database. Many developers mock the data access
            layer to avoid the complexity, but this often leaves a critical part of the system untested. In the rest of
            this post, I'll share some relatively painless strategies for using a real database in your integration
            tests, so they're both robust and reflective of your production environment.
          </p>

          <p>
            In some of my recent projects, we mainly used in-memory databases for our integration tests. They're quick
            and painless to set up, but they come with significant tradeoffs. In particular, an in-memory database
            doesn't accurately represent the behavior of the real database used in production, which can lead to
            differences in query execution or data handling.
          </p>

          <p>
            This became particularly clear when we wanted to start using the <code className="code-highlight">ComplexProperty</code>{' '}
            feature introduced in EF Core 8. The EF Core team hasn't made this feature compatible with in-memory
            databases, and in-memory support is gradually being phased out in newer EF Core versions. Long term,
            in-memory databases were no longer a viable option for our integration tests.
          </p>

          <p>
            We also didn't want to give up <code className="code-highlight">ComplexProperty</code> just to make our tests
            work. That left us with a challenge: how could we effectively use SQL Server (our production database) in
            our integration tests?
          </p>

          <h2>The challenges with LocalDB</h2>

          <p>
            I've seen developers use LocalDB for integration tests. While this works for simple setups, it introduces a
            host of issues:
          </p>

          <ul>
            <li>
              <strong>Test environment parity:</strong> if tests run across multiple environments (e.g., CI
              pipelines, staging, production), keeping them in sync becomes cumbersome.
            </li>
            <li>
              <strong>Clean test state:</strong> ideally, each test runs against a clean database to avoid data
              leaking between tests. A shared LocalDB can lead to flaky tests influenced by leftover data.
            </li>
            <li>
              <strong>Manual interference:</strong> data added to LocalDB manually (outside of tests) can
              unintentionally affect test results.
            </li>
          </ul>

          <p>
            One way to keep a clean test state is to run each test in a transaction and roll it back afterwards.
            However, that doesn't solve the problem of external data contaminating LocalDB.
          </p>

          <p>
            Alternatively, you could use xUnit's <code className="code-highlight">IAsyncLifetime</code> interface to run
            a delete script and clear the database before each test. It works, but it feels clunky and error-prone.
          </p>

          <h2>Introducing Testcontainers</h2>

          <p>
            Enter <a href="https://testcontainers.com/" target="_blank" rel="noreferrer">Testcontainers</a>, a testing
            library with lightweight, easy-to-use APIs for spinning up real services in Docker containers. With
            Testcontainers, you can:
          </p>

          <ul>
            <li>
              <strong>Bootstrap a SQL Server database in a Docker container,</strong> so your tests run against the
              same database type used in production.
            </li>
            <li>
              <strong>Guarantee a clean slate:</strong> each test run starts with a fresh database, with no
              interference from other tests or environments.
            </li>
            <li>
              <strong>Ensure parity:</strong> the same database setup runs locally and in CI.
            </li>
          </ul>

          <h2>Example: a customer microservice</h2>

          <p>
            To demonstrate, I created a demo <strong>customer microservice</strong>. It consumes a customer message
            from a message broker (e.g., RabbitMQ) and saves it to a SQL Server database. The integration tests:
          </p>

          <ul>
            <li>load expected data from a JSON file,</li>
            <li>then compare it to what was saved in the database during the test.</li>
          </ul>

          <p>
            Because the tests use Testcontainers, every run gets a clean SQL Server instance, which keeps the results
            consistent and reliable.
          </p>

          <p>
            You can find the full example, including the Testcontainers setup and the tests themselves, in
            my <a href="https://github.com/kyleherring180/ContainerIntegrationTestsDemo" target="_blank"
                  rel="noreferrer">GitHub repository</a>.
          </p>

          <p>
            I'll assume you're already familiar with setting up the consumer and the data access layer. This post
            focuses on the integration tests project and how to configure the SQL Server test container.
          </p>

          <h3>Step 1: add the package</h3>

          <p>
            Add the Testcontainers NuGet package to the integration tests project, either through your IDE or with
            this command:
          </p>

          <SyntaxHighlighter language="bash" style={coldarkDark}>
            {`dotnet add package Testcontainers.MsSql`}
          </SyntaxHighlighter>

          <h3>Step 2: share one container across tests</h3>

          <p>
            I chose to create a single container that's reused across all tests. To keep tests isolated and avoid data
            conflicts, I configured each test to create its own database inside that container.
          </p>

          <p>
            That means the container has to be started before any tests run. To manage this, I used xUnit's{' '}
            <code className="code-highlight">IClassFixture&lt;&gt;</code> interface. Here's the fixture:
          </p>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`using Testcontainers.MsSql;

namespace ContainerIntegrationTestsDemo.IntegrationTests.Helpers;

public class MsSqlContainerFixture : IAsyncLifetime
{
  public MsSqlContainer MsSqlContainer { get; private set; }

  public async Task InitializeAsync()
  {
      MsSqlContainer = new MsSqlBuilder().Build();
      await MsSqlContainer.StartAsync();
  }

  public async Task DisposeAsync()
  {
      await MsSqlContainer.StopAsync();
  }
}`}
          </SyntaxHighlighter>

          <p>
            <code className="code-highlight">MsSqlContainerFixture</code> starts a new container and waits until it's
            fully up before any tests run. Once all tests have finished, it shuts the container down.
          </p>

          <p>
            Next, add the fixture to the test class and implement the{' '}
            <code className="code-highlight">IAsyncLifetime</code> interface:
          </p>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`namespace ContainerIntegrationTestsDemo.IntegrationTests;

public class IntegrationTest1 : IClassFixture<MsSqlContainerFixture>, IAsyncLifetime
{
    private readonly ITestOutputHelper _output;
    private ServiceProvider _serviceProvider;
    private readonly MsSqlContainer _msSqlContainer;
    private string _dbName;

    public IntegrationTest1(ITestOutputHelper output, MsSqlContainerFixture msSqlContainerFixture)
    {
        _output = output;
        _msSqlContainer = msSqlContainerFixture.MsSqlContainer;
    }`}

          </SyntaxHighlighter>

          <h3>Step 3: a fresh database per test</h3>

          <p>
            Before each test runs, xUnit calls <code className="code-highlight">InitializeAsync</code>. That's where all
            the setup for the test goes. In my case, each test creates a new database, so it starts with a clean slate
            and nothing outside the test can interfere. I used <code className="code-highlight">Guid.NewGuid()</code>{' '}
            to generate a unique database name.
          </p>

          <p>
            <code className="code-highlight">MsSqlContainer</code> provides a{' '}
            <code className="code-highlight">GetConnectionString()</code> method, which connects to the{' '}
            <code className="code-highlight">master</code> database by default. To use a different database, you need
            to set the database name. There are various ways to build a connection string; I opted for the reliable{' '}
            <code className="code-highlight">SqlConnectionStringBuilder</code> class.
          </p>

          <p>
            Finally, I added an extension method that registers the database with the{' '}
            <code className="code-highlight">ServiceCollection</code>, taking the new connection string as a parameter.
          </p>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`public async Task InitializeAsync()
    {
        _dbName = $"IntegrationTestsDb-{Guid.NewGuid():N}";

        var connectionString = $"{_msSqlContainer.GetConnectionString()};";

        var connectionStringBuilder = new SqlConnectionStringBuilder(connectionString)
        {
            InitialCatalog = _dbName
        };

        var updatedConnectionString = connectionStringBuilder.ConnectionString;

        var serviceCollection = new ServiceCollection()
            .AddApplication()
            .AddDataWithoutContext()
            .AddMsSqlTestContainer(updatedConnectionString)
            .AddQueueConsumer();

        _serviceProvider = serviceCollection.BuildServiceProvider();
        await ScopedTestDataRepository().SetupDatabase();
    }
            `}
          </SyntaxHighlighter>

          <p>
            Here's the <code className="code-highlight">AddMsSqlTestContainer</code> extension method. I also created a
            separate <code className="code-highlight">TestDataRepository</code> specifically for my tests.
          </p>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`
namespace ContainerIntegrationTestsDemo.IntegrationTests.Helpers;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddMsSqlTestContainer(this IServiceCollection services, string connectioString)
    {
        return services.AddDbContext<CustomerContext>(options =>
                options.UseSqlServer(connectioString))
            .AddScoped<TestDataRepository>();
    }
}
            `}
          </SyntaxHighlighter>

          <p>
            Once the <code className="code-highlight">ServiceProvider</code> is built, the test's database gets
            created and the migrations are applied. Now we have a clean, working SQL Server database for the test to
            query against.
          </p>

          <h3>Step 4: the test itself</h3>

          <p>
            My example test takes an input XML file and an expected output JSON file. The application consumes the XML
            file exactly as it would in production and saves the new customer to the database.
          </p>

          <p>
            The test then queries the database for the new customer, deserializes the expected JSON into the{' '}
            <code className="code-highlight">Customer</code> class, and uses FluentAssertions to compare the two
            objects.
          </p>

          <h2>Performance concerns and resolutions</h2>

          <p>
            After using this approach on a recent project, I ran into performance issues. Creating a new database for
            every test added significant overhead. So I pivoted: instead of creating a new database each time, I clear
            the existing one before every test.
          </p>

          <p>
            A SQL script that deletes the data from every table felt clunky and error-prone. I wanted a programmatic
            approach that automatically picks up new entities, without manual updates to the tests. Below is the
            solution I arrived at, using EF Core's built-in methods and some reflection.
          </p>

          <SyntaxHighlighter language="csharp" style={coldarkDark}>
            {`
    public async Task ClearDatabase()
    {
        foreach (var entityType in dbContext.Model.GetEntityTypes().Where(x => !x.IsOwned()))
        {
            var clrType = entityType.ClrType;

            //Use reflection to call the generic Set<TEntity>() method on DbContext
            var method = typeof(DbContext)
                .GetMethods()
                .First(m => m.Name == "Set" && m.IsGenericMethod && m.GetParameters().Length == 0)
                .MakeGenericMethod(clrType);

            var dbSet = method.Invoke(dbContext, null) as IQueryable;

            if (dbSet != null)
            {
                //dbSet is now an IQueryable which can be used to get all the entities.
                var entities = dbSet.Cast<object>().ToList();

                //Use RemoveRange to remove all entities of this type
                dbContext.RemoveRange(entities);
            }
        }

        await dbContext.SaveChangesAsync();
    }
            `}
          </SyntaxHighlighter>

          <h2>Wrapping up</h2>

          <p>
            And that's it! You now have integration tests that query a real SQL Server running in a Docker container.
          </p>

          <p>
            I hope you found this post useful. If you have any comments or thoughts, feel free to reach out via my
            Contact page.
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

export default IntegrationTestsContainersBlog;
