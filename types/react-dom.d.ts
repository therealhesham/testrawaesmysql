declare module 'react-dom' {
  import { ReactElement, ReactNode } from 'react';
  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): ReactElement;
  export function render(
    element: ReactElement,
    container: Element | DocumentFragment | null,
    callback?: () => void
  ): any;
  export function unmountComponentAtNode(container: Element): boolean;
  export function findDOMNode(instance: any): Element | null | Text;
  const ReactDOM: {
    createPortal: typeof createPortal;
    render: typeof render;
    unmountComponentAtNode: typeof unmountComponentAtNode;
    findDOMNode: typeof findDOMNode;
  };
  export default ReactDOM;
}
