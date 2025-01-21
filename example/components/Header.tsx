//@ts-nocheck
import { useContext, useEffect, useState } from 'react'
import SidebarContext from 'context/SidebarContext'
// import  "";
import {
  SearchIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  
  MenuIcon,
  OutlinePersonIcon,
  OutlineCogIcon,
  OutlineLogoutIcon,
} from 'icons'  
import _ from "lodash"
import { Avatar, Badge, Input, Dropdown,Modal,Select,
  ModalBody,
Button,Table,TableBody,TableCell,TableContainer,TableFooter,TableHeader,TableRow,
  ModalHeader,
  ModalFooter, DropdownItem, WindmillContext, 
  Label,
  Textarea,
  Pagination} from '@roketid/windmill-react-ui'
import { MessageFilled, SendOutlined ,StepForwardFilled} from '@ant-design/icons'
function Header() {
  const { mode, toggleMode } = useContext(WindmillContext)
  const { toggleSidebar } = useContext(SidebarContext)
const [names,setNames]=useState([])
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
const [ receiver,setReceiver]=useState("")
const [ fullmessage,setFullmessage]=useState("")
const [ title,setTitle]=useState("")
  const [paginatedData,setPaginatedData]=useState([])
  const [length,setLength]=useState(0);

  const [page, setPage] = useState(1);

const resultsPerPage = 10
const [fulldata,setFulldata]=useState([])
const totalResults=fulldata.length

function onPageChange(p) {
  console.log(p)
  // console.log(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // json?setData(json?.slice((page - 1) * resultsPerPage, page * resultsPerPage)):console.log("e");

setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }
// Pagination
  
const [statu,setStatus]=useState("")
useEffect(()=>{
  // setPaginatedData( _.reverse(json).slice((0) * resultsPerPage, page * resultsPerPage))
    try {
      async function names( )  {
    const fetcher =  await fetch("../api/messages")
    const f = await fetcher.json()
  .then(json  => {


  json?setLength(json.length):"";
    setFulldata(json)
    json?setPaginatedData( _.reverse(json).slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");

  } 
  // names();

)
}

names()
  
  
      async function getnames( )  {
     await fetch("../api/admins").then(response => response.json())
  .then(json  => {

setNames(json) } 

)
}

getnames()
// names()

} catch (error) {
  console.log(error)
} 


getUnreaMessages()


},[statu])


const closemodalaftersendmessage =()=>{

setReceiver("")
setTitle("")
setFullmessage("")
  closeModal()
  setStatus("ssss")

}

const sendmessage=async ()=>{

  const fetcher = await fetch('../api/sendmessage',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({receiver,fullmessage,title})})

      const e= await fetcher.json()
      if(fetcher.status == 200) {return closemodalaftersendmessage()};
      // console.log(fetcher.status)
// closeModal()

    }


    // let str = "This is a long ";  
    // let truncatedStr = str.substring(0, 10); // get the first 10 characters  
    // console.log(truncatedStr);   


  function handleNotificationsClick() {
    setIsNotificationsMenuOpen(!isNotificationsMenuOpen)
  }

  function handleProfileClick() {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }
 const [isModalOpen, setIsModalOpen] = useState(false)
 function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }




const [isspecificMessagesOpen, setspecificMessagesopen] = useState(false);
const [isMessagesOpen, setMessagesopen] = useState(false);
 function openMessageModal() {
    setMessagesopen(true)
  }
  function closeMessageModal() {
    setMessagesopen(false)
  }




 function openspecificMessageModal() {
    setspecificMessagesopen(true)
  }
  function closespecificMessageModal() {
    setspecificMessagesopen(false)
  }
const [messid,setmessid]=useState("");

const [specificTitle,setSpeificTitle]=useState("");
const [specificMessage,setSpeificMessage]=useState("");
const [specificSender,setSpeificSender]=useState("");
const [specificread,setspecificread]=useState("");
const openreadmessage=(e)=>{
setSpeificTitle(e.title)
setSpeificSender(e.sender)
setSpeificMessage(e.fullmessage)
openspecificMessageModal()



}


const Readmessage = async (id)=>{
  const fetcher = await fetch('../api/checkreadmessage',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json"
      },body:JSON.stringify({id})})

      const e= await fetcher.json()
      if(fetcher.status == 200) {return openreadmessage(e)};
      // console.log(fetcher.status)
// closeModal()





}
const [unreadMessages,setUnreadMessages]=useState([])
const getUnreaMessages=()=>{
// console.log(fulldata)  
const arr =fulldata.filter((e)=> {return e.read == false})
// console.log(arr)
setUnreadMessages(arr)
// console.log(unreadMessages)
}

return (
    <header className="z-40 py-4 bg-gray shadow-bottom dark:bg-gray-800">
      <div className="container flex items-center justify-between h-full px-6 mx-auto text-purple-600 dark:text-purple-300">
        {/* <!-- Mobile hamburger --> */}



        <Modal  isOpen={isspecificMessagesOpen} onClose={closespecificMessageModal} >
        <ModalHeader>{specificTitle}</ModalHeader>
        <span>from:</span><span>{specificSender}</span>
        <ModalBody >
<p>
{specificMessage}


</p>

        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={()=>{closespecificMessageModal()
            setStatus(new Date())
          }}>
            اغلاق
          </Button>


        </ModalFooter>
      </Modal>    








        <Modal  isOpen={isMessagesOpen} onClose={closeMessageModal} >
        <ModalHeader>{`قائمة المهام`}</ModalHeader>
        <ModalBody >

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>العنوان</TableCell>
              <TableCell>الرسالة</TableCell>
              <TableCell>المُرسل</TableCell>
              <TableCell>التاريخ</TableCell>
              {/* <TableCell>مقرؤة / غير مقرؤة</TableCell> */}


            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>
                <TableCell>
                
                  <div className="flex items-center text-sm" style={{width:"200px"}}>
                    
                    <div>
                     {e?.title ? <span style={{fontWeight:!e.read?"bold":""}}  className="text-sm" >{e.title}</span>:""}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                 {e.fullmessage? <span style={{fontWeight:!e.read?"bold":"",textDecorationLine:"underline",cursor:"pointer"}} className="text-sm" onClick={()=>Readmessage(e.id)}>{e.fullmessage.length>0?e.fullmessage.substring(0, 10)+"...":""}</span>:""}

                </TableCell>
                <TableCell>
                  <span className="text-sm" style={{fontWeight:!e.read?"bold":""}}>{e.sender}</span>

                    
                </TableCell>



       <TableCell>
                  <span style={{fontWeight:!e.read?"bold":""}} className="text-sm">{e.createdat}</span>

                    
                </TableCell>


{/* 
       <TableCell>
                  <span className="text-sm">{e.read}</span>

                    
                </TableCell> */}


              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TableFooter>
          <Pagination

          style={{color:"red"}}
      // layout="link"
      className="active:bg-yellow-600"
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            label="Table navigation"
            onChange={onPageChange}
          />
        </TableFooter>
      </TableContainer>


        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeMessageModal}>
            اغلاق
          </Button>


        </ModalFooter>
      </Modal>    

      
        <Modal  isOpen={isModalOpen} onClose={closeModal} >
        <ModalHeader>{`ارسال رسالة`}</ModalHeader>
        <ModalBody >
<Label>
  العنوان
</Label>
          <Input placeholder='عنوان الرسالة' value={title} onChange={e=>setTitle(e.target.value)}/>

<Label>
  ارسال الى
</Label>

<Select onChange={e=>setReceiver(e.target.value)}>
{names.map(e=>
<option value={e.username}>{e.username}</option>)
}
</Select>


<Label>
  الرسالة
</Label>
          <Textarea style={{height:"150px"}} placeholder='الرسالة' value={fullmessage} onChange={(e)=>setFullmessage(e.target.value)}/>


          {/* <Input placeholder='الرسالة'/> */}


        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            اغلاق
          </Button>

          <Button className="w-full sm:w-auto" style={{backgroundColor:"#Ecc383"}} color="#Ecc383" onClick={()=>sendmessage()}>
            ارسال
          </Button>

        </ModalFooter>
      </Modal>    
                               
        <button
          className="p-1 mr-5 -ml-1 rounded-md lg:hidden focus:outline-none focus:shadow-outline-purple"
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          <MenuIcon className="w-6 h-6" aria-hidden="true" />
        </button>
        {/* <!-- Search input --> */}
        <div className="flex justify-center flex-1 lg:mr-32">
          <div className="relative w-full max-w-xl mr-6 focus-within:text-purple-500">
            <div className="absolute inset-y-0 flex items-center pl-2">
              {/* <SearchIcon className="w-4 h-4" aria-hidden="true" /> */}
            </div>
            
          </div>
        </div>
        <ul className="flex items-center flex-shrink-0 space-x-6">
          {/* <!-- Theme toggler --> */}
          
          
          
          <li className="flex">
            <button
              className="rounded-md focus:outline-none focus:shadow-outline-purple"
              onClick={()=>setIsModalOpen(true)}
              aria-label="Toggle color mode"
            >
            
            <StepForwardFilled style={{color:"#Ecc383"}} />
            </button>
          </li>
          
          <li className="flex">
            <button
              className="rounded-md focus:outline-none focus:shadow-outline-purple"
              onClick={()=>openMessageModal()}
              aria-label="Toggle color mode"
            >
            
            <MessageFilled color='#Ecc383'style={{color:"#Ecc383"}}/>
            </button>
          </li>
          
          
          
          
          
          
          
          {/* <li className="flex">
            <button
              className="rounded-md focus:outline-none focus:shadow-outline-purple"
              onClick={toggleMode}
              aria-label="Toggle color mode"
            >
              {mode === 'dark' ? (
                <SunIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MoonIcon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </li> */}
          {/* <!-- Notifications menu --> */}
        
          {/* <!-- Profile menu --> */}
          <li className="relative">
            <button
              className="rounded-full focus:shadow-outline-purple focus:outline-none"
              onClick={handleProfileClick}
              aria-label="Account"
              aria-haspopup="true"
            >
              <Avatar
                className="align-middle"
                
                src=""
                alt=""
                aria-hidden="true"
              />
            </button>
            {/* <Dropdown
              align="right"
              isOpen={isProfileMenuOpen}
              onClose={() => setIsProfileMenuOpen(false)}
            >
              <DropdownItem tag="a" href="#">
                <OutlinePersonIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                <span>Profile</span>
              </DropdownItem>
              <DropdownItem tag="a" href="#">
                <OutlineCogIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                <span>Settings</span>
              </DropdownItem>
              <DropdownItem onClick={() => alert('Log out!')}>
                <OutlineLogoutIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                <span>Log out</span>
              </DropdownItem>
            </Dropdown> */}
          </li>
        </ul>
      </div>
    </header>
  )
}

export default Header
