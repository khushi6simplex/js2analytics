import { configureStore } from "@reduxjs/toolkit";
import { reveloUserSlice } from "../main-slice/main-slice.ts";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
export const store = configureStore({
  reducer: {
    reveloUserInfo: reveloUserSlice.reducer,
  },
});
// only in case ts
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<
  ReturnType<typeof store.getState>
> = useSelector;
