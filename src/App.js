import React, { useEffect, useRef, useState } from "react";
import { Configuration, OpenAIApi } from "openai";
import "./styles.scss";
import uniqid from "uniqid";
import hexToRgba from "hex-to-rgba";

import SearchIcon from "./images/Search.js";
import CaretDown from "./images/CaretDown.js";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const Palette = ({ description, loading, colours, id }) => {
  const [copiedColour, setCopiedColour] = useState("");
  const [showCopiedColour, setShowCopiedColour] = useState("");

  let timer = useRef(null);

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
    <div className="palette">
      <div
        className={`colours ${loading ? "loading" : ""}`.trim()}
        disabled={loading}
      >
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div
              key={`colour-${id}-${index}`}
              style={{
                background: colours[index] || "#eeeeee",
                boxShadow: `0 25px 20px ${
                  colours[index]
                    ? hexToRgba(colours[index], "0.15")
                    : "rgba(255,255,255,0%)"
                }`,
              }}
              onClick={() => copyToClipboard(colours[index])}
              disabled={colours.length === 0}
            />
          ))}
      </div>
      <p>{description}</p>
      <div
        className={`toast ${showCopiedColour ? "on" : "off"}`}
      >{`${copiedColour} copied to clipboard`}</div>
    </div>
  );
};

export const App = () => {
  const [palettes, setPalettes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("");
  const [dropdownActive, setDropdownActive] = useState(false);
  const [scheme, setScheme] = useState("Complementary");
  const dropdownRef = useRef(null);

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
    setLoading(true);
    const id = uniqid();
    const description = `${scheme} : "${emotion}"`;
    const newPalettes = [
      { loading: true, colours: [], id, description },
      ...palettes,
    ];
    setPalettes(newPalettes);
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
      newPalettes[0] = {
        loading: false,
        colours: matches,
        id,
        description,
      };
      setPalettes(newPalettes);
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
        {palettes.map((palette) => (
          <Palette
            key={`palette-${palette.id}`}
            colours={palette.colours}
            loading={palette.loading}
            id={palette.id}
            description={palette.description}
          />
        ))}
      </section>
    </main>
  );
};
