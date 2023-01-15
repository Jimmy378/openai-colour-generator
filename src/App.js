import React, { useEffect, useRef, useState } from "react";
import { Configuration, OpenAIApi } from "openai";
import "./styles.scss";

import SearchIcon from "./images/Search.js";
import CaretDown from "./images/CaretDown.js";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

export const App = () => {
  const [colours, setColours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("");
  const [dropdownActive, setDropdownActive] = useState(false);
  const [copiedColour, setCopiedColour] = useState("");
  const [showCopiedColour, setShowCopiedColour] = useState("");
  const [scheme, setScheme] = useState("Complementary");
  const dropdownRef = useRef(null);

  let timer = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target !== dropdownRef.current) {
        setDropdownActive(false);
      }
    };

    addEventListener("click", handleClick);

    return () => removeEventListener("click", handleClick);
  }, []);

  const generateColours = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setColours([]);
    setLoading(true);
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `A ${scheme} color scheme of 5 HEX codes, describing the statement: "${emotion}"`,
      temperature: 0,
      max_tokens: 64,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    setLoading(false);

    const newColours = response.data?.choices[0]?.text?.trim();
    const matches = newColours?.match(/#?[0-9A-Fa-f]{6}/g);
    if (matches) {
      setColours(matches);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        if (emotion.length > 0) {
          generateColours();
        }
        break;

      default:
        break;
    }
  };

  const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
    setCopiedColour(value);
    setShowCopiedColour(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setShowCopiedColour(false);
    }, 2000);
  };

  return (
    <main>
      <section>
        <input
          disabled={loading}
          placeholder="Describe a scene to generate a colour palette..."
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          onKeyDown={handleKeyDown}
          onSubmit={generateColours}
        />
        <button
          className="search"
          onClick={generateColours}
          disabled={emotion.length < 1 || loading}
        >
          <SearchIcon />
        </button>
        <button
          className="dropdown"
          disabled={loading}
          onClick={() => setDropdownActive(!dropdownActive)}
          ref={dropdownRef}
        >
          {scheme}
          <CaretDown />
        </button>
        {dropdownActive && (
          <ul>
            <li onClick={() => setScheme("Monochromatic")}>
              {"Monochromatic"}
            </li>
            <li onClick={() => setScheme("Analogous")}>{"Analogous"}</li>
            <li onClick={() => setScheme("Complementary")}>
              {"Complementary"}
            </li>
            <li onClick={() => setScheme("Triad")}>{"Triad"}</li>
            <li onClick={() => setScheme("Tetradic")}>{"Tetradic"}</li>
          </ul>
        )}
        <div
          className={`colours ${loading ? "loading" : ""}`.trim()}
          disabled={loading}
        >
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div
                key={`colour-${index}`}
                style={{ background: colours[index] || "#eeeeee" }}
                onClick={() => copyToClipboard(colours[index])}
                disabled={colours.length === 0}
              />
            ))}
        </div>
        <div
          className={`toast ${showCopiedColour ? "on" : "off"}`}
        >{`${copiedColour} copied to clipboard`}</div>
      </section>
    </main>
  );
};
