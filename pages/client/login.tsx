'use client'

import React, { useContext, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import cookies from "js-cookie";
// import "../api/c"
import { Label, Input, Button, WindmillContext } from '@roketid/windmill-react-ui'
import { GithubIcon, TwitterIcon} from 'icons'
import { useRouter } from 'next/router'
import { ClipLoader } from 'react-spinners'
function LoginPage() {
  const { mode } = useContext(WindmillContext)
  const [idnumber,setIDnumber]= useState("");
  const [Success,setsuccess]=useState(false)
  const [error,setError]=useState("");
  const [password,setPassword]=useState("")
  const [email,setEmail]=useState("")
  const imgSource = mode === 'dark' ? '/assets/img/rpng.png' : '/assets/img/rpng.png'
  const router=useRouter()
  
  const TurnOffOn =()=>{
    setError("خطأ في تسجيل الدخول") ;
    setsuccess(false);;
    
  }
  const handleSignIn = async (e: React.SyntheticEvent) => {
    
    e.preventDefault();
    //@ts-ignore
    setError("")
    setsuccess(true)
await fetch('../api/clientsignin',{method:"POST",headers: {
'Accept': 'application/json',
"Content-Type": "application/json",


},body:JSON.stringify({
email,password

      })}).then(async (e)=>
{        
  // console.log(e);
  
if(e.status == 301) return TurnOffOn(); 
if(e.status != 200) return TurnOffOn();
if(e.status == 200){
  const s= await e.text();
cookies.set("token",s)
// console.log(s)

  router.replace('/client/status');
}

}
).catch((error) => {
       TurnOffOn()
      });
  };

  

  return (
    //@ts-nocheck
    //@ts-ignore
  Success? 
  // 
  
  
   <div className='flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800'>
        <div className='flex flex-col overflow-y-auto md:flex-row'>
          <div className='relative h-32 md:h-auto md:w-1/2'>
            <Image


aria-hidden='true'
              className='hidden object-scale-down w-full h-full'
              src={imgSource}
              alt='شعار روائس القمم'
              layout='fill'
            />
          </div>
          <main className='flex items-center justify-center p-6 sm:p-12 md:w-1/2'>
           <ClipLoader/>
  
          </main>
        </div>
      </div>
  :<div><div className='flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900'>
  <div className='flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800'>
        <div className='flex flex-col overflow-y-auto md:flex-row'>
          <div className='relative h-32 md:h-auto md:w-1/2'>
            <Image


aria-hidden='true'
              className='hidden object-scale-down w-full h-full'
              src={imgSource}
              alt='شعار روائس القمم'
              layout='fill'
            />
          </div>
          <main className='flex items-center justify-center p-6 sm:p-12 md:w-1/2'>
            <div className='w-full'>
              <h1 className='mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200'>
                Login
              </h1>
          {error?<span style={{color:"red"}}>خطأ في البيانات</span>:null}
              <Label>
                <span>Email</span>
                <Input
                onChange={e=>setEmail(e.target.value)}
                  className='mt-1'
                  type='text'
                  value={email}
                  placeholder='Email'
                />
              </Label>

              <Label className='mt-4'>
                <span>Password</span>
                <Input
                onChange={e=>setPassword(e.target.value)}
                  className='mt-1'
                  type='password'
                  value={password}
                  placeholder='***************'
                />
              </Label>

              {/* <Link href='/example' passHref={true}> */}
                <Button  onClick={handleSignIn} className='mt-4' block style={{backgroundColor:"#003749"}}>
                  Log in
                </Button>
              {/* </Link> */}

              <hr className='my-8' />

              {/* <Button block layout='outline'>
                <GithubIcon className='w-4 h-4 mr-2' aria-hidden='true' />
                Github
              </Button> */}
              <Button className='mt-4' block layout='outline'>
                <TwitterIcon className='w-4 h-4 mr-2' aria-hidden='true' />
                Twitter
              </Button>

              <p className='mt-4' >
                {/* <Link href='/example/forgot-password'> */}
                  <a style={{color:"#003749"}} className='text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline'>
                    اتصل بنا
                  </a>
                {/* </Link> */}
              </p>  
              <p className='mt-1'>
                <Link href='/example/create-account'>
                  <a style={{color:"#003749"}} className='text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline'>
                    تسجيل حساب
                  </a>
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div></div>
  
  );
}

export default LoginPage
