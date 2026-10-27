const API_URL = import.meta.env.VITE_API_URL as string
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Query=Record<string,string | number|undefined>
type RequestOptions={
method?: HttpMethod,
 body?: unknown,
 query?: Query
}
type FieldError={
    message:string,
    field:string
}
type ErrorBody={
    error:{
    code:string
    message:string
    details?:FieldError[]
    }
}
export class ApiError extends Error{
     status:number;
     code:string;
     details:FieldError[]
     constructor( status:number,code:string,message:string,details:FieldError[]=[]){
        super(message)
        this.code=code
        this.status=status
        this.details=details
     }
}
const TOKEN_KEY='token'
export const saveToken=(token:string)=>localStorage.setItem(TOKEN_KEY,token)

export const getToken=()=>localStorage.getItem(TOKEN_KEY)

export const clearToken=()=>localStorage.removeItem(TOKEN_KEY);

const request = async<T> (path: string,options:RequestOptions={}):Promise<T> => {
const{method='GET',body,query}=options
let url=API_URL+path
if (query)
{

    const params=new URLSearchParams()
    for (const [key,value] of Object.entries(query)) {
        if(value!==undefined&&value!==''){
            params.append(key,String(value))
        }
       
    }
    if(params.toString()){
            url+='?'+params
    }
}
const headers:Record<string,string>={

}
if(body!==undefined){
    headers['Content-Type']='application/json'
}
const token=getToken()
if(token){
    headers['Authorization']=`Bearer ${token}`
}
let response:Response
try {
    response=await fetch(url,{
        method,
        headers,
        body:body!==undefined?JSON.stringify(body):undefined
    })
}
catch{
    throw new ApiError(0,"NETWORK_ERROR","אין חיבור לשרת")

    
}
if(response.status===204){
    return undefined as T
}
if(!response.ok)
{
    let data:ErrorBody|undefined
    try{
        data=await response.json()
        
       }
    catch{}
    if(response.status===401){
        clearToken();
    }
    throw new ApiError(response.status,data?.error?.code??"UNKNOWN_ERROR",data?.error?.message??"אירע שגיאה",data?.error?.details)
}
return response.json()

}

export default request