import EchoMediaEngine from "../media/EchoMediaEngine";
import { welcomeMediaConfig } from "../../config/welcomeMedia";

export default function WelcomeMediaEngine() {
  return (
    <EchoMediaEngine
      slot="hero"
      media={welcomeMediaConfig}
      className="echoWelcomeCard__media"
    />
  );
}
