// Fixed depth layer: base gradient, slow light orbs, grain. Gives the glass something to refract.
export default function Background() {
  return (
    <div aria-hidden="true" className="backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
