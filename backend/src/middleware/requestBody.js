import express from 'express';

// Browsers send plain JSON. Reject compressed bodies before opening a decoder
// (GHSA-27r3-jxmh-p828); keep the existing application payload limit.
export const createJsonBodyParser = () => express.json({ limit: '2mb', inflate: false });
