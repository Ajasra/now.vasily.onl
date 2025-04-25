import { Container } from "@mantine/core";
import { useAppContext } from "../components/Context/AppContext";
import LanguageMenu from "../components/UI/LanguageMenu";

export default function IndexPage() {
  const { state, dispatch } = useAppContext();

  console.log(state);

  return (
    <Container>
        <h1>Index Page</h1>
        {/* <LanguageMenu /> */}

    </Container>
  );
}
