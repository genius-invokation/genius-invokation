declare module "*.css" {
  const content: string;
  export default content;
}

interface Window {
  showCharacter(id: number): void;
  showCard(id: number): void;
}
