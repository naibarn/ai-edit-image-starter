declare module 'jest' {
  interface Lifecycle {
    (fn: () => void): void;
    (name: string, fn: () => void): void;
    (name: string, fn: (done: () => void) => void): void;
  }
  
  var beforeAll: Lifecycle;
  var afterAll: Lifecycle;
  var beforeEach: Lifecycle;
  var afterEach: Lifecycle;
  
  interface Mock {
    (...args: any[]): any;
    mockResolvedValue(value: any): void;
    mockRejectedValue(value: any): void;
    mockClear(): void;
    mockImplementation(fn: (...args: any[]) => any): void;
  }
  
  function fn(implementation?: any): Mock;
  function mocked<T>(obj: T): T;
  
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toBeChecked(): R;
  }
  
  const expect: {
    <T = any>(actual: T): JestMatchers<T>;
    extend(matchers: object): void;
    any(constructor?: any): any;
    anything(): any;
    arrayContaining(arr: any[]): any;
    objectContaining(obj: any): any;
    stringContaining(str: string): any;
    stringMatching(str: string | RegExp): any;
  };
  
  type JestMatchers<T> = Matchers<T>;
}