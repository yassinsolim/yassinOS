import { useEffect } from "react";
import { type ContainerHookProps } from "components/system/Apps/AppContainer";

const usePortfolio = ({ setLoading }: ContainerHookProps): void => {
  useEffect(() => setLoading(false), [setLoading]);
};

export default usePortfolio;
