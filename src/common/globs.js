// const glob = require("glob");
// const glob = require("globby");
const glob = require("fast-glob");
const multimatch = require("multimatch");

import {
  pipe,
  compact,
  uniq,
  sortBy,
  identity,
  map,
  isEqual
} from "lodash/fp";

import { rootPrepend, splitLines } from "./utility";

// Get array of files matched by glob patterns array
export function fromGlobsToFilesArray(globArray, options) {
  return glob.sync(globArray, options).map(rootPrepend);
}

// Get filepaths from matchArray (file paths) matched by globArray
// matchArray is not necesarry actual files on disk
// (Intersection between globArray matches and matchArray)
export function getGlobMatches(globArray, matchArray) {
  return multimatch(matchArray, globArray);
}

// True if matchArray equals globArray matches
// Matches against a list instead of the filesystem
export function isGlobMatch(globArray, matchArray) {
  const matches = multimatch(matchArray, globArray);
  return isEqual(matchArray, matches);
}

// Get array of files from output stream string
export function fromStdoutToFilesArray(stdout) {
  return pipe(
    // Generate array from lines
    splitLines,
    // Remove empty items and duplicates
    compact,
    uniq,
    // Scripts first
    sortBy(identity),
    // Add ./ if it doesn't already exists
    map(rootPrepend)
  )(stdout);
}
