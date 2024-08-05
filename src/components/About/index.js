import { useEffect, useState } from 'react'
import {
  faMicrosoft,
  faSquareGithub,
  faHtml5,
  faJsSquare,
  faReact,
} from '@fortawesome/free-brands-svg-icons'
import Loader from 'react-loaders'
import CSharp from '../../assets/images/Logo_C_sharp.svg'
import AnimatedLetters from '../AnimatedLetters'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './index.scss'

const About = () => {
  const [letterClass, setLetterClass] = useState('text-animate')

  useEffect(() => {
    setTimeout(() => {
        return setLetterClass('text-animate-hover')
    }, 3000)
  }, [])

  return (
    <>
      <div className="container about-page">
        <div className="text-zone">
          <h1>
            <AnimatedLetters
              letterClass={letterClass}
              strArray={['A', 'b', 'o', 'u', 't', ' ', 'm','e','.']}
              idx={15}
            />
          </h1>
          <p>
            I'm a very ambitious software engineer currently based in The Netherlands.I enjoy working with the latest
            technologies and solving challenging problems to solve business needs.
          </p>
          <p align="LEFT">
            I'm quietly confident (but not afraid to speak my mind), naturally curious, and continually looking to improve processes.
          </p>
          <p>
            If I had to define myself in one sentence that would goal oriented, team player, a sports fanatic,
            outdoor enthusiast.
          </p>
          <p>Next is a list of technologies/methodologies I currently work with:</p>
          <p>.Net • C# • SQL • Github • Azure • React • JavaScript • HTML • CSS • RabbitMQ • Octopus • Github Actions • TeamCity
          • TDD • DDD • Jira • Scrum • Microservice Architecture • API development • BitBucket • SSMS 
          </p>
        </div>

        <div className="stage-cube-cont">
          <div className="cubespinner">
            <div className="face1">
              <FontAwesomeIcon icon={faSquareGithub} color="#fff" />
            </div>
            <div className="face2">
              <FontAwesomeIcon icon={faHtml5} color="#F06529" />
            </div>
            <div className="face3">
              <FontAwesomeIcon icon={faMicrosoft} color="#28A4D9" />
            </div>
            <div className="face4">
              <FontAwesomeIcon icon={faReact} color="#5ED4F4" />
            </div>
            <div className="face5">
              <FontAwesomeIcon icon={faJsSquare} color="#EFD81D" />
            </div>
            <div className="face6">
              <img className='csharp_logo' src={CSharp} alt='csharp' />
            </div>
          </div>
        </div>
      </div>
      <Loader type="pacman" />
    </>
  )
}

export default About