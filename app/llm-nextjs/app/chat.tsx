"use client"
import { useState, useRef, useEffect, createElement, Suspense } from "react";
import { ShopLanding, txtComing } from "./serverData";


export enum ChatMeType {
  llm = "llm",
  me = "me",
  nav = "nav"
}

export type ChatMe = {
  type: ChatMeType,
  text?: string,
  command?: string,
  component?: any
  componentProp?: string
};


//------------------
type ReturnType<T> = {
  data?: T;
  loading: boolean;
  error?: any;
  refetch: () => void;
}

function useAsyncGenerator<T>(generatorFn: () => IterableIterator<Promise<T>>): ReturnType<T> {
  const [state, setState] = useState<ReturnType<T>>({ loading: true, refetch: () => {} });

  useEffect(() => {
    async function executeRequest(gen: IterableIterator<Promise<T>>) {
      try {
        const { value, done } = await gen.next();
        if (!done) {
          setState((prevState) => ({ ...prevState, loading: false, data: value as any }));
          executeRequest(gen);
        } else {
          setState((prevState) => ({ ...prevState, loading: false, data: value }));
        }
      } catch (error) {
        setState((prevState) => ({ ...prevState, loading: false, error }));
      }
    }
    function refetch() {
      setState((prevState) => ({ ...prevState, loading: true }));
      executeRequest(generatorFn());
    }
    executeRequest( generatorFn());
    setState((prevState) => ({ ...prevState, refetch }));
  }, []);
  return state;
}
//-------------------

export default function Chat() {
  const chatContainer = useRef<HTMLDivElement>(null);


  // State for keeping track of our Navigation/Conversation, then make it available to as a Global Context
  const [chatme, setChatme] = useState<Array<ChatMe>>([{type: ChatMeType.nav, component: ShopLanding}])
  const state = useAsyncGenerator<{ data: string}>(txtComing);

  const pushChat = (chat: ChatMe) => {
    console.log (`pushChat ${chat.type} ${chat.text}`)
    setChatme((prev) => [...prev, chat]);
  }

  const handleKeyDown = (event: any) => {
      if (event.key === '/') {
        event.preventDefault();
        pushChat({type: ChatMeType.me, text: event.target.value});
        
      }
  };

  useEffect(() => {
    if (chatContainer.current) {
      chatContainer.current.scrollTop = chatContainer.current.scrollHeight;

    }
  }, [chatme]);

  return (

        <div id="cib-serp-main" className="absolute h-full w-full flex z-0">

          <div id="cib-conversation-main" className="flex relative h-full w-full overflow-y-scroll flex-col flex-1 z-0"  ref={chatContainer}>

              {/* padding top and botton to make space for the action bar and input */}
              <div className="content pt-28 pb-24 -z-1">
              
              { chatme.map((i,idx) => {
                  return i.type === "nav" ? (
                    <Suspense fallback={<p>Loading feed...</p>}> {
                       createElement(i.component, {key: idx, ...i.componentProp && {componentProp: i.componentProp}})
                    }</Suspense>
                 ) :
                 i.type === "llm" ?
               
               <div key={idx} className="flex items-end overflow-auto gap-1 ml-3">
                 <div className="avatar placeholder">
                   <div className="text-neutral-content rounded-full w-8">
                   <img src="https://randomuser.me/api/portraits/men/41.jpg" alt="Bot" className="rounded-full w-10 h-10" />
                   </div>
                 </div> 

                 <div className="chat chat-start">
                   <div className="chat-bubble">It's over Anakin, <br/>I have the high ground.</div>
                 </div>
               </div>
               :  
               <div key={idx}  className="chat chat-end mr-3">
                 <div className="bg-primary  chat-bubble">You underestimate my power!</div>
               </div>
               
         })}
                
              </div>
          </div>


          <div id="cib-action-bar" className="absolute bottom-0 flex w-full  bg-base-100 transition-opacity">

            <div className="px-16 mb-6 mt-4 w-full">

              <div className="join w-full">
              
                <div tabIndex={0} role="button" className="btn m-0 btn btn-primary join-item" onClick={() => pushChat({type: ChatMeType.nav})}>/help</div>
                  

                <div className="dropdown dropdown-top w-full">
                  <input type="text" placeholder="select '/' action of ask me a question here" className="input input-bordered  join-item input-primary w-full" onKeyDown={handleKeyDown}/>
                  <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 w-52">
                    <li><a>/products</a></li>
                    <li><a>/sales</a></li>
                    <li><a>/myorders</a></li>
                  </ul>
                </div>
                
              </div>

            </div>

          </div>

        </div>
   

  );
 }