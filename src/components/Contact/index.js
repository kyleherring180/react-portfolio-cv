import { useEffect, useState } from 'react'
import Loader from 'react-loaders';
import { useRef } from 'react'
import emailjs from '@emailjs/browser'
import './index.scss';
import AnimatedLetters from '../AnimatedLetters';

const Contact = () => {
    const [letterClass, setLetterClass] = useState('text-animate')

    const form = useRef()
    const emailjs_api_key = process.env.REACT_APP_EMAILJS_API_KEY;

    useEffect(() => {
        setTimeout(() => {
          return(setLetterClass('text-animate-hover'))
        }, 4000)
      }, [])

      const sendEmail = (e) => {
        e.preventDefault()
    
        emailjs
          .sendForm('service_53cw7mg', 'template_hnxz2gi', form.current, `${emailjs_api_key}`)
          .then(
            () => {
              alert('Message successfully sent!')
              window.location.reload(false)
            },
            () => {
              alert('Failed to send the message, please try again')
            }
          )
      }

    return (
        <>
            <div className='container contact-page'>
                <div className='text-zone'>
                    <h1>
                        <AnimatedLetters
                            letterClass={letterClass} 
                            strArray={['C','o','n','t','a','c','t',' ','m','e','.']}
                            idx={15} 
                        />
                    </h1>
                    <p>
                        Feel free to get in touch—whether it’s a project, a question, or just to say hello.
                    </p>
                    <div className="contact-form">
                        <form ref={form} onSubmit={sendEmail}>
                        <ul>
                            <li className="half">
                            <input placeholder="Name" type="text" name="name" required />
                            </li>
                            <li className="half">
                            <input
                                placeholder="Email"
                                type="email"
                                name="email"
                                required
                            />
                            </li>
                            <li>
                            <input
                                placeholder="Subject"
                                type="text"
                                name="subject"
                                required
                            />
                            </li>
                            <li>
                            <textarea
                                placeholder="Message"
                                name="message"
                                required
                            ></textarea>
                            </li>
                            <li>
                            <input type="submit" className="flat-button" value="SEND" />
                            </li>
                        </ul>
                        </form>
                    </div>
                </div>
            </div>
            <Loader type="pacman" />
        </>
    )
}

export default Contact