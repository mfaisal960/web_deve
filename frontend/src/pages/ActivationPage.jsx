import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { server } from '../server'

export default function ActivationPage() {
    const { activation_token } = useParams()
    const [result, setResult] = useState(null)

    useEffect(() => {
        if (!activation_token) {
            return
        }

        // The effect used to have no dependency array, so every render re-sent
        // the activation request.
        const activationEmail = async () => {
            try {
                const res = await axios.post(`${server}/user/activation`, {
                    activation_token,
                })

                setResult('success')
                console.log(res.data.message)
            } catch (error) {
                console.log(error?.response?.data?.message || error)
                setResult('error')
            }
        }

        activationEmail()
    }, [activation_token])

    const status = activation_token ? result : 'error'

    if (status === null) {
        return <p>Verifying your account...</p>
    }

    return (
        <div>
            {
                status === 'error' ? (
                    <p>Your token is expired!</p>
                ) : (
                    <p> Your account has been create successfully! </p>
                )
            }
        </div>
    )
}
