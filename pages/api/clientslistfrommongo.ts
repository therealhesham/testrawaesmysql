import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {
try {
  const femaleworkerlist=await prisma.client.findMany();
    res.status(200).send(femaleworkerlist);

} catch (error) {
  console.log("error")
  res.status(301).send("femaleworkerlist")

// res.send("error")  
}

}

// import wixData from 'wix-data';
// import wixLocationFrontend from 'wix-location-frontend';
// import wixUsers from 'wix-users';
// import {local, session, memory} from 'wix-storage-frontend';
// import {fetch} from 'wix-fetch';
// import {URL} from "backend/otp.web"

// let OTP="" ;
// /**
// *	Adds an event handler that runs when the element is clicked.
// 	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
// *	 @param {$w.MouseEvent} event
// */

// let idnumber=Number();
// let phonenumber=Number();


// const isLogged=false;
// const isSent = false ;


//  export function button9_click(event) {


//  idnumber= Number($w("#idnumber").value);
//  phonenumber = Number($w('#phonenumber').value);
// 	 console.log(idnumber,phonenumber)
// // console
// wixData.query("mgbgdyh5hhdk3b").eq("number1",phonenumber).eq("number",idnumber)
// .find().then(e=>{
	

// console.log(e.items[0].number)
// function generateOTP() { 
//   // let OTP ="";  
//     let digits = '0123456789'; 
//     let len = digits.length 
//     for (let i = 0; i < 4; i++) { 
//         OTP += digits[Math.floor(Math.random() * len)]; 
//     } 
     
//     return OTP; 
// } 
// // Use code 67887 to confirm your phone number on Rawaes



// // console.log(phonenumber)
// const gen = generateOTP()
// // console.log(gen)

// console.log("https://www.brcitco-api.com/api/sendsms/?user=966555544961&pass=Rwes1484&to=966"+phonenumber+"&message=Use code "+gen+" to confirm your phone number on Rawaes&sender=RawaesES")
// fetch("https://www.brcitco-api.com/api/sendsms/?user=966555544961&pass=Rwes1484&to=966"+phonenumber+"&message=Use code "+gen+" to confirm your phone number on Rawaes&sender=RawaesES", {"method": "get"})
//   .then( (httpResponse) => {
//     if (httpResponse.ok) {
// // console.log("")
// $w('#text138').text = "جاري ارسال الكود الى رقم هاتفك";

// const isSent = true;  
// $w('#text138').show();
// setTimeout(() => {
// $w("#input1").show();
// $w("#button9").hide();

// $w("#button11").show();
  
// }, 1000);    } else {
      
// $w('#text138').text = "جاري ارسال الكود الى رقم هاتفك";

// const isSent = true;  
// $w('#text138').show();
// setTimeout(() => {
// $w("#input1").show();
// $w("#button9").hide();

// $w("#button11").show();
  
// }, 1000);
//     }
//   } )
//   .then(json => 
//   {


// $w('#text138').text = "جاري ارسال الكود الى رقم هاتفك";

// const isSent = true;  
// $w('#text138').show();

// setTimeout(() => {
// $w("#input1").show();
// $w("#button9").hide();

// $w("#button11").show();
  
// }, 1000);
// }

//   )
//   .catch(err => 
  
  
//   {
// // $w('#text138').
// $w('#text138').text = "جاري ارسال الكود الى رقم هاتفك";
// $w('#text138').show();
// setTimeout(() => {
// $w("#input1").show();
// $w("#button9").hide();

// $w("#button11").show();
  
// }, 1000);
// }
//   );
//  }



     

// ).catch(e=>{
  
// const isSent = false;  
// $w('#text138').text = "البيانات تبدو خاطئة, الرجاء التأكد من صحة البيانات المدخلة";
// $w('#text138').show();}


// );

  
//   // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
// 	// Add your code for this event here: 
// }


// $w.onReady(e=>{




// $w("#button11").hide();
// $w("#input1").hide();
// $w("#text138").hide();

// const idnumber = Number(local.getItem("id"));
// const phonenumber = Number(local.getItem("phonenumber"));

// console.log(idnumber+1,phonenumber+1)
// wixData.query("mgbgdyh5hhdk3b").eq("number1",phonenumber).eq("number",idnumber)
// .find().then(e=>{

// console.log("e")

// 	//  wixLocationFrontend.to("/privetpage")

// // }
// // else if(e.items.length <1)
// // {

	
// // }
// }
// ).catch(e=>
// {

// // }
// // $w("#spinner").collapse();
// // $w("#spinner").setAttribute("show", "false")
// console.log("not Registered")
// })
// // 
// })

// /**
// *	Adds an event handler that runs when the element is clicked.
// 	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
// *	 @param {$w.MouseEvent} event
// */


// export function button11_click(event) {
// // console.log("otp0",OTP)
// 	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
// 	// Add your code for this event here: 
// console.log($w('#input1').value == OTP);
// if ($w('#input1').value == OTP) {
// if($w('#text138').hidden){



// $w('#text138').text = "جاري تحويلك الى صفحتك الاستثمارية";
// $w('#text138').show();


// setTimeout(() => {

// local.setItem("id",idnumber);
// 	 local.setItem("phonenumber",phonenumber)
//    const isLogged = true;
//   wixLocationFrontend.to("/privetpage");  
// }, 1000);

// }else {


// $w('#text138').text = "جاري تحويلك الى صفحتك الاستثمارية";
// // $w('#text138').hide();

// setTimeout(() => {
  
//   local.setItem("id",idnumber);
// 	 local.setItem("phonenumber",phonenumber)
//  const isLogged = true;
//   wixLocationFrontend.to("/privetpage");

// }, 1000);
    

// }

// }
// else {
// const isLogged = false;

// if($w('#text138').hidden){
// $w('#text138').text = "الرمز غير صحيح";
// $w('#text138').show()}else{
// $w('#text138').text = "الرمز غير صحيح";



// }

// }




// }