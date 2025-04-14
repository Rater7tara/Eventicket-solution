import React from 'react'
import { Link, useRouteError,  } from 'react-router-dom';
import Error from '../assets/error.json';
import Lottie from "lottie-react";


const ErrorPage = () => {
  const { error, status } = useRouteError()
  return (
    <section className='m-auto'>
      <div className='m-auto flex justify-center align-middle'>
      <Lottie animationData={Error} loop={true}/>
        
      </div>
      <div className=' text-center'>
          <Link to='/' className='btn btn-info mb-8'>
            Back to homepage
          </Link>
        </div>
    </section>
  )
}

export default ErrorPage;