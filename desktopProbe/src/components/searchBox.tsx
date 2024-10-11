import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import { Input } from './ui/input';

export function SearchBox() {
  const [inputValue, setInputValue] = useState('');

  const handleClearInput = () => {
    setInputValue('');
  };

  return (
    <div className="relative mb-3 ml-[1px] mr-2 mt-1 h-12">
      <Input
        className="h-full w-full overflow-x-scroll rounded-xl px-11"
        placeholder="Search..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <MagnifyingGlassIcon className="absolute left-5 top-3.5 h-5 w-fit text-muted-foreground" />

      {inputValue && (
        <Cross2Icon
          className="absolute right-3.5 top-3.5 h-5 w-5 cursor-pointer text-muted-foreground"
          onClick={handleClearInput}
        />
      )}
    </div>
  );
}
