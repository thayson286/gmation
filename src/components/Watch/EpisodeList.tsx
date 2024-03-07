import React, { useState, useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faThList,
  faTh,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

// Define TypeScript interfaces for episode and props
interface Episode {
  id: string;
  number: number;
  title: string;
  image: string;
}

interface Props {
  animeId: string | undefined;
  episodes: Episode[];
  selectedEpisodeId: string;
  onEpisodeSelect: (id: string) => void;
}

// Styled components for the episode list
const ListContainer = styled.div`
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border-radius: var(--global-border-radius);
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  max-height: 35rem;
  @media (max-width: 1000px) {
    max-height: 18rem;
  }
`;

const EpisodeGrid = styled.div<{ $isRowLayout: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isRowLayout }) =>
    $isRowLayout ? "1fr" : "repeat(auto-fill, minmax(4rem, 1fr))"};
  gap: 0.4rem;
  padding: 0.6rem;
  overflow-y: auto;
  flex-grow: 1;
`;

const ListItem = styled.button<{
  $isSelected: boolean;
  $isRowLayout: boolean;
  $isWatched: boolean;
}>`
  background-color: ${({ $isSelected, $isWatched }) =>
    $isSelected
      ? $isWatched
        ? "var(--primary-accent-bg)" // Selected and watched
        : "var(--primary-accent-bg)" // Selected but not watched
      : $isWatched
      ? "var(--primary-accent-bg); filter: brightness(0.8);" // Not selected but watched
      : "var(--global-tertiary-bg)"};

  border: none;
  border-radius: 0.2rem;
  color: ${({ $isSelected, $isWatched }) =>
    $isSelected
      ? $isWatched
        ? "var(--global-text)" // Selected and watched
        : "var(--global-text)" // Selected but not watched
      : $isWatched
      ? "var(--primary-accent); filter: brightness(0.8);" // Not selected but watched
      : "grey"}; // Not selected and not watched

  padding: ${({ $isRowLayout }) =>
    $isRowLayout ? "0.6rem 0.5rem" : "0.4rem 0"};
  text-align: ${({ $isRowLayout }) => ($isRowLayout ? "left" : "center")};
  cursor: pointer;
  justify-content: ${({ $isRowLayout }) =>
    $isRowLayout ? "space-between" : "center"};
  align-items: center;
  transition: 0.15s;

  &:hover {
    ${({ $isSelected, $isWatched }) =>
      $isSelected
        ? $isWatched
          ? "filter: brightness(1.1)" // Selected and watched
          : "filter: brightness(1.1)" // Selected but not watched
        : $isWatched
        ? "filter: brightness(1.1)" // Not selected but watched
        : "background-color: var(--global-button-hover-bg); filter: brightness(1.05); color: #ffffff"};
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--global-secondary-bg);
  border-bottom: 1px solid var(--global-shadow);
  padding: 0.25rem 0;
`;

const SelectInterval = styled.select`
  padding: 0.75rem;
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border: none;
  border-radius: var(--global-border-radius);
`;

const LayoutToggle = styled.button`
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-shadow);
  padding: 0.5rem;
  margin-right: 0.5rem;
  cursor: pointer;
  color: var(--global-text);
  border-radius: var(--global-border-radius);
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: var(--global-button-hover-bg);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-shadow);
  padding: 0.5rem;
  margin: 0 0.5rem;
  border-radius: var(--global-border-radius);
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: var(--global-button-hover-bg);
  }
`;

const SearchInput = styled.input`
  border: none;
  background-color: transparent;
  color: var(--global-text);
  margin-left: 0.5rem;
  outline: none;
  width: 100%;

  &::placeholder {
    color: var(--global-placeholder);
  }
`;

const Icon = styled.div`
  color: var(--global-text);
  opacity: 0.5;
  font-size: 0.8rem;
  transition: opacity 0.2s;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const EpisodeNumber = styled.span``;
const EpisodeTitle = styled.span`
  padding: 0.5rem;
`;

// The updated EpisodeList component
const EpisodeList: React.FC<Props> = ({
  animeId,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
}) => {
  // State for interval, layout, user layout preference, search term, and watched episodes
  const [interval, setInterval] = useState<[number, number]>([0, 99]);
  const [isRowLayout, setIsRowLayout] = useState(true);
  const [userLayoutPreference, setUserLayoutPreference] = useState<
    boolean | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [watchedEpisodes, setWatchedEpisodes] = useState<Episode[]>([]);
  const [selectionInitiatedByUser, setSelectionInitiatedByUser] =
    useState(false);
  // Update local storage when watched episodes change
  useEffect(() => {
    if (animeId && watchedEpisodes.length > 0) {
      localStorage.setItem(
        `watched-episodes-${animeId}`,
        JSON.stringify(watchedEpisodes)
      );
    }
  }, [animeId, watchedEpisodes]);
  // Load watched episodes from local storage when animeId changes
  useEffect(() => {
    if (animeId) {
      const watched = localStorage.getItem("watched-episodes");
      if (watched) {
        const watchedEpisodesObject = JSON.parse(watched);
        const watchedEpisodesForAnime = watchedEpisodesObject[animeId];
        if (watchedEpisodesForAnime) {
          setWatchedEpisodes(watchedEpisodesForAnime);
        }
      }
    }
  }, [animeId]);

  // Function to handle episode selection
  // Function to mark an episode as watched
  const markEpisodeAsWatched = useCallback(
    (id: string) => {
      if (animeId) {
        setWatchedEpisodes((prevWatchedEpisodes) => {
          const updatedWatchedEpisodes = [...prevWatchedEpisodes];
          const selectedEpisodeIndex = updatedWatchedEpisodes.findIndex(
            (episode) => episode.id === id
          );
          if (selectedEpisodeIndex === -1) {
            const selectedEpisode = episodes.find(
              (episode) => episode.id === id
            );
            if (selectedEpisode) {
              updatedWatchedEpisodes.push(selectedEpisode);
              // Update the watched episodes object in local storage
              localStorage.setItem(
                "watched-episodes",
                JSON.stringify({
                  ...JSON.parse(
                    localStorage.getItem("watched-episodes") || "{}"
                  ),
                  [animeId]: updatedWatchedEpisodes,
                })
              );
              return updatedWatchedEpisodes;
            }
          }
          return prevWatchedEpisodes;
        });
      }
    },
    [episodes, animeId]
  );
  const handleEpisodeSelect = useCallback(
    (id: string) => {
      setSelectionInitiatedByUser(true);
      markEpisodeAsWatched(id); // Mark the episode as watched
      onEpisodeSelect(id);
    },
    [onEpisodeSelect, markEpisodeAsWatched]
  );

  // Update watched episodes when a new episode is selected or visited
  useEffect(() => {
    if (selectedEpisodeId && !selectionInitiatedByUser) {
      markEpisodeAsWatched(selectedEpisodeId);
    }
  }, [selectedEpisodeId, selectionInitiatedByUser, markEpisodeAsWatched]);

  // Generate interval options
  const intervalOptions = useMemo(() => {
    return episodes.reduce<{ start: number; end: number }[]>(
      (options, _, index) => {
        if (index % 100 === 0) {
          const start = index;
          const end = Math.min(index + 99, episodes.length - 1);
          options.push({ start, end });
        }
        return options;
      },
      []
    );
  }, [episodes]);

  // Handle interval change
  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [start, end] = e.target.value.split("-").map(Number);
      setInterval([start, end]);
    },
    []
  );

  // Toggle layout preference
  const toggleLayoutPreference = useCallback(() => {
    setIsRowLayout((prevLayout) => {
      const newLayout = !prevLayout;
      setUserLayoutPreference(newLayout);
      return newLayout;
    });
  }, []);

  // Filter episodes based on search input
  const filteredEpisodes = useMemo(() => {
    return episodes.filter((episode) => {
      const searchQuery = searchTerm.toLowerCase();
      return (
        episode.title?.toLowerCase().includes(searchQuery) ||
        episode.number.toString().includes(searchQuery)
      );
    });
  }, [episodes, searchTerm]);

  // Determine layout based on episodes and user preference
  useEffect(() => {
    const allTitlesNull = episodes.every((episode) => episode.title === null);
    const defaultLayout = episodes.length <= 26 && !allTitlesNull;

    setIsRowLayout(
      userLayoutPreference !== null ? userLayoutPreference : defaultLayout
    );

    // Find the selected episode
    if (!selectionInitiatedByUser) {
      const selectedEpisode = episodes.find(
        (episode) => episode.id === selectedEpisodeId
      );
      if (selectedEpisode) {
        // Find the interval containing the selected episode
        for (let i = 0; i < intervalOptions.length; i++) {
          const { start, end } = intervalOptions[i];
          if (
            selectedEpisode.number >= start + 1 &&
            selectedEpisode.number <= end + 1
          ) {
            setInterval([start, end]);
            break;
          }
        }
      }
    }
  }, [
    episodes,
    userLayoutPreference,
    selectedEpisodeId,
    intervalOptions,
    selectionInitiatedByUser,
  ]);

  // Render the EpisodeList component
  return (
    <ListContainer>
      <ControlsContainer>
        <SelectInterval
          onChange={handleIntervalChange}
          value={`${interval[0]}-${interval[1]}`}
        >
          {intervalOptions.map(({ start, end }, index) => (
            <option key={index} value={`${start}-${end}`}>
              Episodes {start + 1} - {end + 1}
            </option>
          ))}
        </SelectInterval>

        <SearchContainer>
          <Icon>
            <FontAwesomeIcon icon={faSearch} />
          </Icon>
          <SearchInput
            type="text"
            placeholder="Search episodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <LayoutToggle onClick={toggleLayoutPreference}>
          {isRowLayout ? (
            <FontAwesomeIcon icon={faTh} />
          ) : (
            <FontAwesomeIcon icon={faThList} />
          )}
        </LayoutToggle>
      </ControlsContainer>

      <EpisodeGrid $isRowLayout={isRowLayout}>
        {filteredEpisodes.slice(interval[0], interval[1] + 1).map((episode) => {
          const $isSelected = episode.id === selectedEpisodeId;
          const $isWatched = watchedEpisodes.some((e) => e.id === episode.id);

          return (
            <ListItem
              key={episode.id}
              $isSelected={$isSelected}
              $isRowLayout={isRowLayout}
              $isWatched={$isWatched}
              onClick={() => handleEpisodeSelect(episode.id)}
              aria-selected={$isSelected}
            >
              {isRowLayout ? (
                <>
                  <EpisodeNumber>{episode.number}</EpisodeNumber>
                  <EpisodeTitle>{episode.title}</EpisodeTitle>
                  {$isSelected && <FontAwesomeIcon icon={faPlay} />}
                </>
              ) : $isSelected ? (
                <FontAwesomeIcon icon={faPlay} />
              ) : (
                <EpisodeNumber>{episode.number}</EpisodeNumber>
              )}
            </ListItem>
          );
        })}
      </EpisodeGrid>
    </ListContainer>
  );
};

export default EpisodeList;
