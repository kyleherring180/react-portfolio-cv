import { Link, NavLink } from 'react-router-dom';
import './index.scss';
import LogoS from '../../assets/images/logo_sub_kh.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHome, faUser, faPen } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const Sidebar = () => (
    <div className='nav-bar'>
        <Link className='logo' to='/react-portfolio-cv'>
            <img src={LogoS} alt="logo" />
        </Link>
        <nav>
            <NavLink
                to="/react-portfolio-cv"
                end
                className={({ isActive }) => (isActive ? 'active home-link' : 'home-link')}
            >
                <FontAwesomeIcon icon={faHome} color="#4d4d4e" />
            </NavLink>
            <NavLink
                to="/react-portfolio-cv/about"
                className={({ isActive }) => (isActive ? 'active about-link' : 'about-link')}
            >
                <FontAwesomeIcon icon={faUser} color="#4d4d4e" />
            </NavLink>
            <NavLink
                to="/react-portfolio-cv/blog"
                className={({ isActive }) => (isActive ? 'active blog-link' : 'blog-link')}
            >
                <FontAwesomeIcon icon={faPen} color="#4d4d4e" />
            </NavLink>
            <NavLink
                to="/react-portfolio-cv/contact"
                className={({ isActive }) => (isActive ? 'active contact-link' : 'contact-link')}
            >
                <FontAwesomeIcon icon={faEnvelope} color="#4d4d4e" />
            </NavLink>
        </nav>
        <ul>
            <li>
                <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.linkedin.com/in/kyle-herring-a35288113/"
                >
                    <FontAwesomeIcon icon={faLinkedin} color="#4d4d4e" />
                </a>
            </li>
            <li>
                <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/kyleherring180"
                >
                    <FontAwesomeIcon icon={faGithub} color="#4d4d4e" />
                </a>
            </li>
        </ul>
    </div>
);

export default Sidebar;
