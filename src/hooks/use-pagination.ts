"use client";

import { useState } from "react";

export function usePagination(defaultLimit = 25) {
  const [page, setPage] = useState(1);
  const [limit] = useState(defaultLimit);

  const reset = () => setPage(1);

  return { page, limit, setPage, reset };
}
