import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const Portal = ({ children, portal = "root" }) => {
  const [portalRoot, setPortalRoot] = useState(null);

  const updatePortal = () => {
    const portalRoot = document.getElementById(portal);
    setPortalRoot(portalRoot);
  };

  useEffect(() => {
    updatePortal();
  }, []);

  if (!portalRoot) {
    return null;
  }

  return createPortal(children, portalRoot);
};
