import { useEffect, useState } from 'react'
import Loader from 'react-loaders';
import { useRef } from 'react'
import emailjs from '@emailjs/browser'
import './index.scss';
import AnimatedLetters from '../AnimatedLetters';

const Contact = () => {
    const [letterClass, setLetterClass] = useState('text-animate')
    // 'idle' | 'sending' | 'sent' | 'error'
    const [status, setStatus] = useState('idle')

    const form = useRef()
    const emailjs_api_key = process.env.REACT_APP_EMAILJS_API_KEY;

    useEffect(() => {
        setTimeout(() => {
          return(setLetterClass('text-animate-hover'))
        }, 4000)
      }, [])

      const sendEmail = (e) => {
        e.preventDefault()
        setStatus('sending')

        emailjs
          .sendForm('service_53cw7mg', 'template_hnxz2gi', form.current, `${emailjs_api_key}`)
          .then(
            () => {
              form.current.reset()
              setStatus('sent')
            },
            () => {
              setStatus('error')
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
                            <input
                                type="submit"
                                className="flat-button"
                                value={status === 'sending' ? 'SENDING…' : 'SEND'}
                                disabled={status === 'sending'}
                            />
                            </li>
                            {status === 'sent' && (
                            <li className="form-status success" role="status">
                                Thanks, your message has been sent. I'll get back to you soon.
                            </li>
                            )}
                            {status === 'error' && (
                            <li className="form-status error" role="alert">
                                Something went wrong sending your message. Please try again.
                            </li>
                            )}
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