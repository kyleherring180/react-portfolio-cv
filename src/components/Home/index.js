import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from 'react-loaders'
import AnimatedLetters from '../AnimatedLetters'
import './index.scss'

const Home = () => {
  const [letterClass, setLetterClass] = useState('text-animate')

  const nameArray = [' ','k', 'y', 'l', 'e']
  const jobArray = [
    's',
    'o',
    'f',
    't',
    'w',
    'a',
    'r',
    'e',
    ' ',
    'e',
    'n',
    'g',
    'i',
    'n',
    'e',
    'e',
    'r',
    '.'
  ]

  useEffect(() => {
    setTimeout(() => {
      return(setLetterClass('text-animate-hover'))
    }, 4000)
  }, [])

  return (
    <>
      <div className="container home-page">
        <div className="text-zone">
          <h1>
            <span className={letterClass}>H</span>
            <span className={`${letterClass} _12`}>i,</span>
            <br/>
            <span className={`${letterClass} _13`}>I</span>
            <span className={`${letterClass} _14`}>'m</span>

            <AnimatedLetters
                letterClass={letterClass}
                strArray={nameArray}
                idx={15}
            />
            <br/>
            <AnimatedLetters
                letterClass={letterClass}
                strArray={jobArray}
                idx={22}
            />
          </h1>
          <h2>Fullstack Developer / .Net Expert </h2>
          <div className="button-container">
            <Link to="/react-portfolio-cv/contact" className="flat-button">
              CONTACT ME
            </Link>
            <Link to="/react-portfolio-cv/blog" className="flat-button">
              BLOG
            </Link>
          </div>
        </div>
      </div>
      <Loader type="pacman"  active/>
    </>
  )
}

export default Home