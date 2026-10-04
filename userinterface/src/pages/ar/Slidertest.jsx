import React from 'react';
import Slider from 'react-slick';
import { banners } from '../../utils/constants';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const BannerSlider = () => {
    const NextArrow = ({ onClick }) => (
        <button
            onClick={onClick}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white cursor-pointer bg-opacity-50 text-[#f84464] p-2 rounded-full z-10 hover:bg-opacity-70"
        >
            Next
        </button>
    );

    const PrevArrow = ({ onClick }) => (
        <button
            onClick={onClick}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white cursor-pointer bg-opacity-50 text-[#f84464] p-2 rounded-full z-10 hover:bg-opacity-70"
        >
            Prev
        </button>
    );

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        
        arrows: true,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
     
    };

 

    return (
        <div className='w-full bg-white py-2 relative'>
            <div className='mx-auto px-4'>
                <Slider {...settings}>
                   {banners.map((banner, i) => (
                       <div key={banner.id} className='px-2'>
                        <img 
                           src={banner.image}
                           alt={`banner-${banner.id}`}
                           className='w-full h-[150px] md:h-[250px] rounded-sm object-cover'
                        />
                       </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}

export default BannerSlider;