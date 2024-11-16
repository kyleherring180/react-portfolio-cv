import { useEffect, useState } from 'react'
import Loader from 'react-loaders'
import AnimatedLetters from '../AnimatedLetters'
import './index.scss'

const blogPosts = [
    {
        id: 1,
        image: '',
        title: 'Integration Testing',
        description: 'This is the first blog post.',
    }
];
const Blog = () => {
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
                            strArray={['B', 'l', 'o', 'g', '.']}
                            idx={15}
                        />
                    </h1>
                    <div className="blog-grid">
                        {blogPosts.map((post) => (
                            <div></div>
                        ))}
                    </div>
                </div>
            </div>
            <Loader type="pacman" active/>
        </>
    )
}

export default Blog