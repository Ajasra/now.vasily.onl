import React, {useEffect, useState} from "react";
import { Button, Container, Group } from "@mantine/core";
import { useAppContext } from "../../Context/AppContext";

const languages = require("./languages.json");

export default function LanguageMenu() {
  const { state, dispatch } = useAppContext();

  const [current, setCurrent] = useState("en");

  useEffect(() => {
    setCurrent(state.language);
  }, [state.language]);

  const handleLanguageChange = (languageCode: string) => {
    dispatch({ type: "SET_LANGUAGE", payload: languageCode });
  };

  return (
    <Container>
      <Group>
        {languages.map((language: { code: string; name: string }) => (
          <Button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            variant={current === language.code ? "filled" : "outline"}
          >
            {language.name}
          </Button>
        ))}
      </Group>
    </Container>
  );
}