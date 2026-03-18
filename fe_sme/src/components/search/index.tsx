import { Input } from "antd";
import type { SearchProps } from "antd/es/input";
import React from "react";

type Props = Omit<SearchProps, "onSearch"> & {
  onSearch?: (value: string | undefined) => void;
};

const BaseSearch: React.FC<Props> = ({ onSearch, ...rest }) => {
  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    onSearch?.(trimmed === "" ? undefined : trimmed);
  };

  return <Input.Search onSearch={handleSearch} allowClear {...rest} />;
};

export default BaseSearch;
