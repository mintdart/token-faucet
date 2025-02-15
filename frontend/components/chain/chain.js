import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Paper, Button, Tooltip, withStyles } from '@material-ui/core';
import classes from './chain.module.css';
import stores, { useAccount, useChain } from '../../stores/index.js';
import { ACCOUNT_CONFIGURED } from '../../stores/constants';
import Image from 'next/image';
import { addToNetwork, renderProviderText } from '../../utils';
import Link from 'next/link';
import { ethers } from "ethers";

async function mint(address) {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    address,
    [
      //"function transferFrom(address _from, address _to, uint256 _tokenId) external payable",
      "function mint() external"
    ],
    signer
  )
  await contract.mint()
}

const chainIdToExplorer = {
  4: "https://rinkeby.etherscan.io/address"
}

async function getChainId() {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const { chainId } = await provider.getNetwork()
  return chainId
}

export default function Chain({ token: [symbol, address, originalAddress, decimals] }) {
  const account = useAccount((state) => state.account);
  const setAccount = useAccount((state) => state.setAccount);

  const [chainId, setChainId] = useState(undefined)

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
    };

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);

    const accountStore = stores.accountStore.getStore('account');
    setAccount(accountStore);
    getChainId().then(setChainId)

    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
    };
  }, []);

  const icon = useMemo(() => {
    return originalAddress ? `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${originalAddress}/logo.png` : '/unknown-logo.png';
  }, [address]);

  return (
    <>
      <Paper elevation={1} className={classes.chainContainer} key={address}>
        <div className={classes.chainNameContainer}>
          <Image
            src={icon}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/chains/unknown-logo.png';
            }}
            width={28}
            height={28}
            className={classes.avatar}
          />

          <Tooltip title={symbol}>
            <Typography variant="h3" className={classes.name} noWrap style={{ marginLeft: '24px' }}>
                {symbol}
            </Typography>
          </Tooltip>
        </div>
        <div className={classes.chainInfoContainer}>
          <div className={classes.dataPoint}>
            <Typography variant="subtitle1" color="textSecondary" className={classes.dataPointHeader}>
              Address
            </Typography>
            <Typography variant="h5">{address.substring(0, 8)}...</Typography>
          </div>
          <div className={classes.dataPoint}>
            <Typography variant="subtitle1" color="textSecondary" className={classes.dataPointHeader}>
              Decimals
            </Typography>
            <Typography variant="h5">{decimals}</Typography>
          </div>
        </div>
        <div style={{ marginBottom: "-0.5em" }}>
          {account?.address &&
            <>
              <div className={classes.addButton}>
                <Button variant="outlined" color="primary" onClick={() => mint(address)}>
                  Mint
                </Button>
              </div>
              <a href={`${chainIdToExplorer[chainId]}/${address}`}>
                <div className={classes.addButton}>
                  <Button variant="outlined" color="primary">
                    Go to explorer
                  </Button>
                </div>
              </a>
            </>
          }
          <div className={classes.addButton}>
            <Button variant="outlined" color="primary" onClick={() => addToNetwork(account, address, symbol, decimals, icon)}>
              {renderProviderText(account)}
            </Button>
          </div>
          <div className={classes.addButton}>
            <Button variant="outlined" color="primary" onClick={() => navigator.clipboard.writeText(address)}>
              Copy address
            </Button>
          </div>
        </div>
      </Paper>
    </>
  );
}
