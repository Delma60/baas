import { redirect } from "next/navigation";
import getServerSession from "next-auth";
import { authConfig } from "@/lib/auth/config";

export default  function UserRedirectPage({ children }:{ children:React.ReactNode }) {

  
  return <> { children } </>
}
