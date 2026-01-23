import Timer from "@/components/Timer/Timer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     
        <ThemeToggle/>
       <main className="min-h-screen flex items-center justify-center p-6">
        <Timer/>
       </main>
       
      
    </div>
  );
}
