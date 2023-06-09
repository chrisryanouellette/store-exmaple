import { ChangeEvent, InputHTMLAttributes, useState } from "react";
import {
  UseCreateStore,
  createGlobalStore,
  useCreateStore,
  useStore,
} from "./store";
import { contextFactory } from "./context";
import "./App.css";

// const store = createGlobalStore<UserDetails>({
//   firstName: "",
//   lastName: "",
// });

// setTimeout(() => {
//   store.set({firstName: 'I"m loaded late from the server'})
// }, 2000)

export type UserDetails = {
  firstName: string;
  lastName: string;
};

const [AppContext, useAppContext] =
  contextFactory<UseCreateStore<UserDetails>>();

const MyInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
  return <input {...props} />;
};

type MyDisplayProps = {
  item: keyof UserDetails;
};

const MyDisplay = ({ item }: MyDisplayProps) => {
  const store = useAppContext();
  const name = useStore(store, function listener(state) {
    return state[item];
  });

  return <p>{name}</p>;
};

function App(): JSX.Element {
  const [hide, setHide] = useState<boolean>(false);
  const store = useCreateStore<UserDetails>({
    firstName: "",
    lastName: "",
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const id = event.currentTarget.id;
    store.set({
      [id]: event.currentTarget.value,
    });
  }

  return (
    <AppContext.Provider value={store}>
      <main>
        Hello Kenny!
        <label>First Name</label>
        <MyInput id="firstName" onChange={handleChange} />
        {!hide ? <MyDisplay item="firstName" /> : null}
        <button onClick={() => setHide(!hide)}>Toggle</button>
        <label>First Name</label>
        <MyInput id="lastName" onChange={handleChange} />
        <MyDisplay item="lastName" />
      </main>
    </AppContext.Provider>
  );
}

export default App;
