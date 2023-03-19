import React, { useState, useCallback, useEffect } from "react";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { ComponentProps, ReactNode } from "react";
import { useGeolocated } from "react-geolocated";
import { DASHBOARD_URL } from "../constants";
import { SignInIcon } from "../icons";
import { MarketingLayout } from "../layouts/Marketing";
import { signIn } from "next-auth/react";
import * as Server from "../lib/server";
import { Button, LinkButton } from "../primitives/Button";
import { Container } from "../primitives/Container";
import styles from "./index.module.css";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import Geocode from "react-geocode";

Geocode.setApiKey("AIzaSyChTOZ525vKb1CUQYyB7VWPzZxXjSDLyGg");
Geocode.setLanguage("en");
// set response region. Its optional.
// A Geocoding request with region=es (Spain) will return the Spanish city.
Geocode.setRegion("es");
// set location_type filter . Its optional.
// google geocoder returns more that one address for given lat/lng.
// In some case we need one address as response for which google itself provides a location_type filter.
// So we can easily parse the result for fetching address components
// ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE are the accepted values.
// And according to the below google docs in description, ROOFTOP param returns the most accurate result.
Geocode.setLocationType("ROOFTOP");

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

interface FeatureProps extends Omit<ComponentProps<"div">, "title"> {
  description: ReactNode;
  title: ReactNode;
}

function Feature({ title, description, className, ...props }: FeatureProps) {
  return (
    <div className={clsx(className, styles.featuresFeature)} {...props}>
      <h4 className={styles.featuresFeatureTitle}>{title}</h4>
      <p className={styles.featuresFeatureDescription}>{description}</p>
    </div>
  );
}

export default function Index() {
  const { coords, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyChTOZ525vKb1CUQYyB7VWPzZxXjSDLyGg",
  });

  const [map, setMap] = useState(null);
  const [location, setLocation] = useState({
    address: null,
    city: null,
    state: null,
    country: null,
  });

  useEffect(() => {
    if (coords){
      Geocode.fromLatLng(coords.latitude, coords.longitude).then(
        (response) => {
          const address = response.results[0].formatted_address;
          let city, state, country;
          for (
            let i = 0;
            i < response.results[0].address_components.length;
            i++
          ) {
            for (
              let j = 0;
              j < response.results[0].address_components[i].types.length;
              j++
            ) {
              switch (response.results[0].address_components[i].types[j]) {
                case "locality":
                  city = response.results[0].address_components[i].long_name;
                  break;
                case "administrative_area_level_1":
                  state = response.results[0].address_components[i].long_name;
                  break;
                case "country":
                  country = response.results[0].address_components[i].long_name;
                  break;
              }
            }
          }
          setLocation({
            address: address,
            city: city,
            state: state,
            country: country,
          });
        },
        (error) => {
          console.error(error);
        }
      );
    }
    return;
  }, [coords, isLoaded]);

  const onLoad = useCallback(function callback(map) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    console.log(map);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);
  return (
    <MarketingLayout>
      <Container className={styles.section}>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>
            Kickstart the {location.city ? location.city : "Local"} Garden Club
          </h1>
          <p className={styles.heroLead}>
            Use the Starter Kit to build your Garden Club app in minutes.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Button icon={<SignInIcon />} onClick={() => signIn()}>
            Sign in
          </Button>
          <LinkButton
            href="https://liveblocks.io/docs/guides/nextjs-starter-kit"
            target="_blank"
            variant="secondary"
          >
            Learn more
          </LinkButton>
        </div>
      </Container>

      <Container className={styles.section}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className={styles.featuresGrid}>
          <Feature
            description={
              <>
                A collaborative whiteboard app with included share menu,
                documents listing, users, groups, permissions, and more.
              </>
            }
            title="Liveblocks"
          />
          <Feature
            description={
              <>
                Best practices followed, using a mixture of SSR and custom API
                endpoints. Modify documents from both client and server.
              </>
            }
            title="Next.js"
          />
          <Feature
            description={
              <>
                Adjust our reusable interface & design system to fit your needs.
              </>
            }
            title="User Interface"
          />
          <Feature
            description={
              <>
                All custom client and server functions are fully typed, and easy
                to update.
              </>
            }
            title="TypeScript"
          />
          <Feature
            description={
              <>
                Complete authentication, compatible with any NextAuth provider,
                including GitHub, Google, Auth0, and many more.
              </>
            }
            title="NextAuth.js"
          />
          <Feature
            description={
              <>
                See data update live using the SWR (state-while-revalidate)
                library.
              </>
            }
            title="SWR"
          />
        </div>
      </Container>

      {coords?.latitude ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{
            lat: coords?.latitude,
            lng: coords?.longitude,
          }}
          zoom={13}
          onUnmount={onUnmount}
        >
          <></>
        </GoogleMap>
      ) : (
        ``
      )}
    </MarketingLayout>
  );
}

// If logged in, redirect to dashboard
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await Server.getServerSession(req, res);

  if (session) {
    return {
      redirect: {
        permanent: false,
        destination: DASHBOARD_URL,
      },
    };
  }

  return {
    props: {},
  };
};
