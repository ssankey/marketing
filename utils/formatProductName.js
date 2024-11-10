const shortenName = (name, maxLength = 20) => {
    if (!name) return 'N/A';
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  export default shortenName;