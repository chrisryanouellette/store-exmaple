import { useEffect, useState } from "react";
import { AddEventListener, Listener, UserDetails } from "./App";

type MyDisplayProps = {
  item: keyof UserDetails;
  addEventListener: AddEventListener;
};

export const MyDisplay = ({ item, addEventListener }: MyDisplayProps) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    const listener: Listener = (newState) => {
      // I run anytime there is a change
      console.log("CHILD, I am the listener, I will update my state >", item);
      setDisplayValue(newState[item]);
    };

    console.log("CHILD, I want to know about changes, telling parent >", item);
    const removeEventListener = addEventListener(listener);

    return () => {
      // Component is unmounting
      console.log(
        "CHILD, Im about to unmount, I no longer need to know about changes >",
        item
      );
    //   console.log(
    //     "CHILD, Im about to unmount, I no longer need to know about changes BUT I forgot to call removeEventListener >",
    //     item
    //   );
      removeEventListener();
    };
  }, [addEventListener, item]);

  return <p>{displayValue}</p>;
};
