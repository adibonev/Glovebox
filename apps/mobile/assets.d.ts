// Let TypeScript resolve static image imports (Metro turns them into asset module ids).
declare module "*.webp" {
  const asset: number;
  export default asset;
}
declare module "*.png" {
  const asset: number;
  export default asset;
}
