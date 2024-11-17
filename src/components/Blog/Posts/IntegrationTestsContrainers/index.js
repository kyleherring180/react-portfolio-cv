import { useEffect, useState } from 'react'
import AnimatedLetters from '../../../AnimatedLetters'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';


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
                "Integration",
                " ",
                "Tests",
                " ",
                "using",
                " ",
                "Test",
                " ",
                "Containers",
                " ",
                "for",
                " ",
                ".Net",
                " ",
                "and",
                " ",
                "Microsoft",
                " ",
                "SQL",
                " ",
                "Server",
                "."
              ]
              }
              idx={25}
            />
          </h1>
          <p>
            When it comes to testing in software development, opinions often vary on the value and types of tests that
            should be prioritized. While most developers agree that unit tests are foundational for any codebase,
            integration tests are equally important—and often underappreciated.
          </p>

          <p>
            In this post, I’ll focus on the role of integration tests and how they help ensure your application’s
            reliability. Unlike unit tests, which verify individual components in isolation, integration tests validate
            that different parts of your system work together as expected. They catch issues that unit tests might miss,
            giving you confidence that your changes haven’t introduced regressions or deviations in functionality. When
            my integration tests pass after code changes, I can deploy to production with peace of mind, knowing my
            application should continue to perform as intended.
          </p>

          <p>
            Integration tests can be more challenging to implement because they often involve managing multiple
            dependencies, making setup and maintenance more complex. Despite this, I firmly believe that well-designed
            integration tests provide significantly more value than unit tests. By validating how components interact,
            integration tests often cover the functionality of individual units as well. This means that with a robust
            suite of integration tests, you may reduce your reliance on unit tests, streamlining your testing strategy
            while maintaining confidence in your system’s behavior.
          </p>

          <p>
            Of course, some dependencies may need to be mocked in integration tests, but it’s essential to minimize this
            as much as possible. The more we mock, the further our tests drift from a real system, reducing their
            effectiveness. One of the most challenging dependencies to include in integration tests is the database.
            Many developers mock the data access layer to avoid the complexity, but this often leaves a critical part of
            the system untested. In the rest of this post, I’ll share some relatively painless strategies to incorporate
            a real database into your integration tests, ensuring they are both robust and reflective of your production
            environment.
          </p>

          <p>
            In some of my recent projects, we primarily used in-memory databases for our integration tests. While they
            are quick and painless to implement, they come with significant tradeoffs. For one, in-memory databases
            don’t accurately represent the behavior of the actual database used in production, leading to potential
            differences in query execution or data handling.
          </p>

          <p>
            This tradeoff became particularly evident when we wanted to start using the ComplexProperty feature
            introduced in EF Core 8. Unfortunately, the EF Core team has not made this feature compatible with in-memory
            databases, and support for in-memory databases is gradually being phased out in newer EF Core versions. Long
            term, in-memory databases were no longer a viable option for our integration tests. Moreover, we didn’t want
            to forgo using ComplexProperty just to make our integration tests work. This left us with a challenge: how
            could we effectively use a SQL Server database (our production database) in our integration tests?
          </p>

          <h2>The Challenges with LocalDB</h2>

          <p>
            I’ve seen developers use localdb for integration tests. While this works for simple setups, it introduces a
            host of issues:
          </p>

          <ul>
            <li>
              <strong>Test Environment Parity:</strong> If tests are run across multiple environments (e.g., CI
              pipelines, staging, production), maintaining parity becomes cumbersome.
            </li>
            <li>
              <strong>Clean Test State:</strong> Ideally, each test should run against a clean database to avoid data
              leakage from other tests. A shared localdb could lead to flaky tests influenced by leftover data.
            </li>
            <li>
              <strong>Manual Interference:</strong> Data added to the localdb manually (outside of tests) could
              unintentionally impact test results.
            </li>
          </ul>

          <p>
            One solution to maintain a clean test state is to run each test in a transaction and roll it back after
            completion. However, this doesn’t solve the problem of external data contamination in the localdb.
            Alternatively, you could use the <code className="code-highlight">IAsyncLifetime</code> interface from xUnit to run a delete script and
            clear the database before each test. While functional, this approach feels clunky and error-prone.
          </p>

          <h2>Introducing Testcontainers</h2>

          <p>
            Enter Testcontainers, a testing library that provides lightweight and easy-to-use APIs for spinning up real
            services in Docker containers. With Testcontainers, you can:
          </p>

          <ul>
            <li>
              <strong>Bootstrap a SQL Server database in a Docker container:</strong> This ensures that your tests are
              run against the same database type used in production.
            </li>
            <li>
              <strong>Guarantee a clean slate:</strong> Each test run starts with a fresh database state, eliminating
              interference from other tests or environments.
            </li>
            <li>
              <strong>Ensure parity:</strong> Testcontainers makes it simple to replicate your production database setup
              across local and CI environments.
            </li>
          </ul>

          <p>
            For more details about Testcontainers, visit <a href="https://testcontainers.com/" target="_blank"
                                                            rel="noreferrer">Testcontainers</a>.
          </p>

          <h2>Example: Customer Microservice</h2>

          <p>
            To demonstrate the value of Testcontainers, I created a demo <strong>Customer Microservice</strong>. This
            service consumes a customer message from a message broker (e.g., RabbitMQ) and saves it to a SQL Server
            database. The integration tests:
          </p>

          <ul>
            <li>Load expected data from a JSON file.</li>
            <li>Compare the expected data to what was saved in the database during the test.</li>
          </ul>

          <p>
            By using Testcontainers, the tests are able to spin up a clean SQL Server instance for each run, ensuring
            consistent and reliable results.
          </p>

          <p>
            You can find the full example, including the code for setting up Testcontainers and running the tests, on
            my <a href="https://github.com/kyleherring180/ContainerIntegrationTestsDemo" target="_blank"
                  rel="noreferrer">GitHub repository</a>.
          </p>

          <p>
            For this demo, I will assume you are already familiar with setting up the consumer part of the solution and
            adding the data access layer. This post will focus specifically on the integration tests project library and
            how to configure the MsSqlTest container for the tests.
          </p>

          <p>
            The first step is to add the Testcontainers NuGet package to the integration tests project
            library.
            This can be done using the UI or by running the following command:
          </p>
          
          <code className="code-highlight">dotnet add package Testcontainers.MsSql</code>

          <p>
            In my setup, I chose to create a single container that would be reused across all tests. However, to ensure
            test
            isolation and avoid data conflicts between tests, I configured the container to create a new database for
            each
            test. This required initializing the container before the tests began running. To manage this setup, I used
            the{' '}
            <code className="code-highlight">IClassFixture&lt;&gt;</code> interface from xUnit. Here’s the fixture implementation:
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
            The <code className="code-highlight">MsSqlContainerFixture</code> initializes a new container before any tests begin execution and ensures 
            the container is fully started before the tests run. Once all tests have finished, the fixture shuts 
            down the container. Next, we will add the fixture to our test class and implement the <code className="code-highlight">IAsyncLifetime</code>
            interface.
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
          <p>
            Before execution, each test will call the <code className="code-highlight">InitializeAsync</code> 
            method, where all necessary setup for the test should be performed. In my case, I needed to create 
            a new database for each test to ensure a clean slate and avoid interference from external data 
            manipulation. To achieve this, I used the <code className="code-highlight">Guid.NewGuid()</code> 
            method to generate unique database names.

            The <code className="code-highlight">MsSqlContainer</code> class provides a
            <code className="code-highlight">GetConnectionString()</code> method, which by default connects to the 
            master database. To use a different database, we need to specify the desired database name. While 
            there are various ways to construct a connection string, I opted to use the reliable
            <code className="code-highlight">SqlConnectionStringBuilder</code> class.

            Finally, I added an extension method to integrate the 
            <code className="code-highlight">MsSqlContainer</code> with the
            <code className="code-highlight">ServiceCollection</code>,
            allowing it to accept the new connection string as a parameter.
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
            And the <code className="code-highlight">AddMsSqlTestContainer</code> Extension method follows below. 
            I also created a separate <code className="code-highlight">TestDataRepository</code> specifically
            for my tests. 
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
            After building up my <code className="code-highlight">ServiceProvider</code>, the database for
            that particular test should be created. I then apply the migrations to the database. Now we have
            a clean working Microsoft SQL Server database that the test can query against. 
          </p>
          <p>
            For my example test I provide an input xml file and an expected output JSON file. I consume
            the xml file and my application runs as if it were running on production. Saving the new
            customer to the database. The test then queries the database for this new customer and deserializes
            the expected JSON into the Customer class. Finally, I use FluentAssertions to compare the two objects.
          </p>
          <p>
            And that is it! You now have an Integration Test that is querying against a Microsoft SQL Server in a
            docker container. I hope you found this post useful. If you have any comments or thoughts, please feel
            free to reach out to me via my Contact page.
          </p>
          <p>
            Kyle
          </p>

        </div>
      </div>
    </>
  )
}

export default IntegrationTestsContainersBlog;