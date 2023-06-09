import {
    ChangeEvent,
    InputHTMLAttributes,
    useState,
    useRef,
    useEffect,
  } from "react";
  import "./App.css";
  
  export type UserDetails = {
    firstName: string;
    lastName: string;
  };
  
  // Unsubcribe and Subscribe
  export type Listener = (update: UserDetails, prev: UserDetails) => void;
  export type RemoveEventListener = () => void;
  export type AddEventListener = (cb: Listener) => RemoveEventListener;
  
  const MyInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
    return <input {...props} />;
  };
  
  type MyDisplayProps = {
    item: keyof UserDetails;
    addEventListener: AddEventListener;
  };
  
  const MyDisplay = ({ item, addEventListener }: MyDisplayProps) => {
    const [displayValue, setDisplayValue] = useState<string>("");
  
    useEffect(() => {
      console.log("CHILD, I want to know about changes, telling parent >", item);
      return addEventListener((update) => {
        console.log("CHILD, I am the listener, I will update my state >", item);
        setDisplayValue(update[item]);
      });
    }, [addEventListener, item]);
  
    return <p>{displayValue}</p>;
  };
  
  function App(): JSX.Element {
    const [hide, setHide] = useState<boolean>(false);
    const userDetail = useRef<UserDetails>({
      firstName: "",
      lastName: "",
    });
  
    // Set<Listener> === Listeners[]
    const listeners = useRef<Set<Listener>>(new Set());
  
    function addEventListener(listener: Listener) {
      console.log(
        "PARENT, A child wants to know when something changes, taking note for later"
      );
      listeners.current.add(listener);
      console.log("Number of children listening", listeners.current.size);
  
      return function removeEventListener() {
        console.log(
          "PARENT, a child no longer want to know about changes, removing listener"
        );
        listeners.current.delete(listener);
      };
    }
  
    /** Fake setState */
    const setUserDetail = (cb: (oldState: UserDetails) => UserDetails) => {
      const oldState = userDetail.current;
      userDetail.current = cb(oldState);
  
      // Let the listeners know a something changed
      console.log("PARENT, I just updated. I need to tell the children");
  
      listeners.current.forEach((listener) => {
        console.log(
          "PARENT, I'm inside a loop and am about to call a listener from the child."
        );
        listener(userDetail.current, oldState);
      });
    };
  
    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
      const id = event.currentTarget.id;
      setUserDetail((prev) => ({
        ...prev,
        [id]: event.currentTarget.value,
      }));
    }
  
    return (
      <main>
        Hello Kenny!
        <label>First Name</label>
        <MyInput id="firstName" onChange={handleChange} />
        {!hide ? (
          <MyDisplay item="firstName" addEventListener={addEventListener} />
        ) : null}
        <button onClick={() => setHide(!hide)}>Toggle</button>
        {/* <label>Last Name</label>
        <MyInput id="lastName" onChange={handleChange} />
        <MyDisplay item="lastName" addEventListener={addEventListener} /> */}
      </main>
    );
  }
  
  export default App;
  