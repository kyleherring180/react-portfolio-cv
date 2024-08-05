import { useEffect, useState, React } from 'react'
import AnimatedLetters from '../../AnimatedLetters'
import './index.scss'

const Skills = () => {
    const [letterClass, setLetterClass] = useState('text-animate')

    const skills = [
        { name: 'C#', icon: '' },
        { name: '.Net', icon: '' },
        { name: 'SQL', icon: '' },
        { name: 'Github', icon: '' },
        { name: 'Azure', icon: '' },
        { name: 'JavaScript', icon: '' },
        { name: 'React', icon: '' },
        { name: 'Node.js', icon: '' },
        { name: 'HTML', icon: '' },
        { name: 'CSS', icon: '' },
        { name: 'Jira', icon: '' },
        { name: 'Scrum', icon: '' },
        { name: 'Octopus', icon: '' },
        { name: 'TeamCity', icon: '' },
      ];

    useEffect(() => {
        setTimeout(() => {
            return setLetterClass('text-animate-hover')
        }, 3000)
    }, [])
    return(
        <>
        <div className='skill-set'>
            <h3>
                <AnimatedLetters
                letterClass={letterClass}
                strArray={['S', 'k', 'i', 'l', 'l', ' ', 's','e','t','.']}
                idx={15}
                />
            </h3>
            <ul className="skills-list">
                {skills.map((skill) => (
                <li key={skill.name} className="skill-item">
                    <span className="skill-icon">{skill.icon}</span>
                    {skill.name}
                </li>
                ))}
            </ul>
        </div>
        </>
    )
}

export default Skills
