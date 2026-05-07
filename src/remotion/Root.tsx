import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import "../index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={600}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          title: "Study Material",
          summary: "Loading summary...",
          topics: ["Study", "Learning", "Focus"]
        }}
      />
    </>
  );
};
