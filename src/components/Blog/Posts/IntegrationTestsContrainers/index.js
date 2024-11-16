import { useEffect, useState } from 'react'
import AnimatedLetters from '../../../AnimatedLetters'


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
            When it comes to testing in software development, opinions often differ on the value 
            and types of tests that should be prioritized. Most developers agree that unit tests 
            are a critical foundation for any codebase. However, integration tests are equally important 
            and often underappreciated.
          </p>
          <p>
            In this post, I’ll focus on the role of integration tests and how they help ensure the reliability 
            of your application. Integration tests validate that different components of your system work 
            together as expected, catching issues that unit tests might miss. They give you confidence that your 
            changes haven’t introduced regressions or deviations in functionality. After implementing code changes, 
            if all my integration tests pass, I can deploy to production with peace of mind, knowing that my 
            application should continue to function as intended.
          </p>
          <p>
            Integration tests can be more challenging to implement because they often involve managing multiple 
            dependencies, which can complicate setup and maintenance. Despite these challenges, I firmly believe 
            that well-designed integration tests provide significantly more value than unit tests. When 
            implemented effectively, integration tests can validate the interaction between components and, 
            in many cases, cover the functionality of individual units as well. This means that with a robust 
            suite of integration tests, the reliance on unit tests can be reduced, streamlining your overall 
            testing strategy while maintaining confidence in your application’s behavior.
          </p>
          <p>
            While some dependencies may need to be mocked in integration tests, it’s crucial to minimize this 
            as much as possible. The more we mock, the further our tests drift from the real system, and the less 
            confidence we can place in their results. One of the most challenging dependencies to include in 
            integration tests is the database. Many developers opt to mock the data access layer entirely to 
            sidestep this difficulty. However, by doing so, we miss testing a critical part of our system, 
            potentially leaving gaps in our test coverage.

            In the rest of this post, I’ll explore some relatively painless strategies to incorporate a real 
            database into your integration tests, ensuring they remain robust and reflective of your production 
            environment.
          </p>
        </div>
      </div>
    </>
  )
}

export default IntegrationTestsContainersBlog;