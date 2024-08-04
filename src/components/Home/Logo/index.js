import './index.scss';
import LogoK from '../../../assets/images/logo_k.png'

const Logo = () => {

    return(
        <div className='logo-container' ref={bgRef}>
            <img ref={solidLogoRef} className='solid-logo' src={LogoK} alt='K'/>

            <svg
                width="559pt"
                height="897pt"
                version="1.0"
                viewBox="0 0 559 897"
                xmlns="http://www.w3.org/2000/svg"
            >
            
            </svg>
        </div>
    )
}

export default Logo
