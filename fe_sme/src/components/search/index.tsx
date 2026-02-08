import Input, { SearchProps } from 'antd/es/input';
import React from 'react';

interface Props extends SearchProps {
    onSearch?: (value?: string) => void;
}

const Search: React.FC<Props> = ({ onSearch, ...rest }) => {
    const handleChange = (value: string) => {
        if (value === '') onSearch?.(undefined);
    };

    const handleSearch = (value: string) => {
        onSearch?.(value?.trim());
    };

    return <Input.Search {...rest} onChange={e => handleChange(e.target.value)} onSearch={handleSearch} />;
};

export default Search;
