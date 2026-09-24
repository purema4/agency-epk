import { createContext, useContext } from "react";
import { networkFetch, type ApiConfig } from "./client";

const ApiContext = createContext<ApiConfig>({ baseUrl: "/api", fetch: networkFetch });

export const ApiProvider = ApiContext.Provider;
export const useApi = () => useContext(ApiContext);
