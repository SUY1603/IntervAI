import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading,user } = useAuth()


    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loading-screen__spinner' />
                <h2 className='loading-screen__title'>Verifying your session...</h2>
                <p className='loading-screen__sub'>Just a moment, we are securing your connection.</p>
            </main>
        )
    }

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected