import { Link, NavLink } from 'react-router-dom';
import './index.scss';
import LogoS from '../../assets/images/logo_sub_kh.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHome, faUser, faPen } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const Sidebar = () => (
    <div className='nav-bar'>
        <Link className='logo' to='/'>
            <img src={LogoS} alt="logo" />
        </Link>
        <nav>
            <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? 'active home-link' : 'home-link')}
            >
                <FontAwesomeIcon icon={faHome} color="#8d8d8d" />
            </NavLink>
            <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? 'active about-link' : 'about-link')}
            >
                <FontAwesomeIcon icon={faUser} color="#8d8d8d" />
            </NavLink>
            <NavLink
                to="/blog"
                className={({ isActive }) => (isActive ? 'active blog-link' : 'blog-link')}
            >
                <FontAwesomeIcon icon={faPen} color="#8d8d8d" />
            </NavLink>
            <NavLink
                to="/contact"
                className={({ isActive }) => (isActive ? 'active contact-link' : 'contact-link')}
            >
                <FontAwesomeIcon icon={faEnvelope} color="#8d8d8d" />
            </NavLink>
        </nav>
        <ul>
            <li>
                <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.linkedin.com/in/kyle-herring-a35288113/"
                >
                    <FontAwesomeIcon icon={faLinkedin} color="#8d8d8d" />
                </a>
            </li>
            <li>
                <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/kyleherring180"
                >
                    <FontAwesomeIcon icon={faGithub} color="#8d8d8d" />
                </a>
            </li>
        </ul>
    </div>
);

export default Sidebar;
