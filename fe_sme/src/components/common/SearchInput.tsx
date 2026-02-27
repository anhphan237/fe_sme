/**
 * SearchInput - ported from PMS internal system (components/search)
 * Ant Design Search input with trimming + clear-on-empty behavior
 *
 * @example
 * const [search, setSearch] = useState('')
 * <SearchInput
 *   placeholder="Tìm kiếm nhân viên..."
 *   onSearch={setSearch}
 *   allowClear
 * />
 */
import Input from "antd/es/input";
import type { SearchProps } from "antd/es/input";

export interface SearchInputProps extends SearchProps {
  onSearch?: (value?: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, ...rest }) => {
  const handleChange = (value: string) => {
    if (value === "") onSearch?.(undefined);
  };

  const handleSearch = (value: string) => {
    onSearch?.(value?.trim() || undefined);
  };

  return (
    <Input.Search
      {...rest}
      onChange={(e) => handleChange(e.target.value)}
      onSearch={handleSearch}
    />
  );
};

export default SearchInput;
